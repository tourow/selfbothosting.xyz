import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { decryptToken, maskToken } from '../../../lib/encryption';
import { requireHttps, sanitizeError } from '../../../lib/security';
import { checkRateLimit } from '../../../lib/rate-limiter';

const BOTS_DATA_FILE = path.join(process.cwd(), '.bots-data.json');

interface BotInstance {
  id: string;
  token: string; 
  prefix: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
  lastError?: string;
  createdAt: string;
}

function loadBotsData(): BotInstance[] {
  try {
    if (fs.existsSync(BOTS_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(BOTS_DATA_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading bots data:', error);
  }
  return [];
}

function saveBotsData(bots: BotInstance[]): void {
  try {
    fs.writeFileSync(BOTS_DATA_FILE, JSON.stringify(bots, null, 2));
  } catch (error) {
    console.error('Error saving bots data:', error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitCheck = checkRateLimit(request);
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response!;
    }

    if (!requireHttps(request)) {
      return NextResponse.json(
        { success: false, error: 'HTTPS required' },
        { status: 403 }
      );
    }

    const botId = params.id;
    const bots = loadBotsData();
    const updatedBots = bots.filter(b => b.id !== botId);

    if (updatedBots.length === bots.length) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    saveBotsData(updatedBots);
    return NextResponse.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    const errorMsg = sanitizeError(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!requireHttps(request)) {
      return NextResponse.json(
        { success: false, error: 'HTTPS required' },
        { status: 403 }
      );
    }

    const botId = params.id;
    const body = await request.json();
    const { action, prefix } = body;

    const bots = loadBotsData();
    const bot = bots.find(b => b.id === botId);

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      bot.status = 'running';
      try {
        decryptToken(bot.token);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 500 }
        );
      }
    } else if (action === 'stop') {
      bot.status = 'stopped';
    } else if (action === 'update-prefix') {
      if (!prefix || typeof prefix !== 'string' || prefix.length > 5) {
        return NextResponse.json(
          { success: false, error: 'Invalid prefix' },
          { status: 400 }
        );
      }
      bot.prefix = prefix;
    }

    saveBotsData(bots);
    
    return NextResponse.json({ 
      success: true, 
      bot: {
        ...bot,
        token: maskToken(decryptToken(bot.token))
      }
    });
  } catch (error) {
    const errorMsg = sanitizeError(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
