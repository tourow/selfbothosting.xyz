import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { encryptToken, decryptToken, maskToken } from '../../lib/encryption';
import { requireHttps, sanitizeError } from '../../lib/security';
import { checkRateLimit } from '../../lib/rate-limiter';

const BOTS_DATA_FILE = path.join(process.cwd(), '.bots-data.json');

interface BotInstance {
  id: string;
  token: string; // Encrypted token
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

export async function GET(request: NextRequest) {
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

    const bots = loadBotsData();
    const botsList = bots.map(bot => ({
      ...bot,
      token: maskToken(decryptToken(bot.token)) // Decrypt then mask
    }));
    return NextResponse.json({ success: true, bots: botsList });
  } catch (error) {
    const errorMsg = sanitizeError(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { token, prefix = '$', action } = body;

    if (action === 'add') {
      if (!token || typeof token !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 400 }
        );
      }

      const bots = loadBotsData();
      
      const usedPorts = bots.map(b => b.port);
      let nextPort = 3001;
      while (usedPorts.includes(nextPort)) {
        nextPort++;
      }

      const encryptedToken = encryptToken(token);

      const newBot: BotInstance = {
        id: `bot_${Date.now()}`,
        token: encryptedToken,
        prefix,
        port: nextPort,
        status: 'stopped',
        createdAt: new Date().toISOString(),
      };

      bots.push(newBot);
      saveBotsData(bots);

      return NextResponse.json({ 
        success: true, 
        bot: {
          ...newBot,
          token: maskToken(token)
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    const errorMsg = sanitizeError(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
