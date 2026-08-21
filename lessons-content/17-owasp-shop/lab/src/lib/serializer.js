'use strict';

// ============================================================
// CSPACK v1 - legacy client-state serializer (DO NOT USE IN PROD)
// Format: base64( "key=value;" pairs )
//   value prefixes:
//     s:<text>        -> string
//     n:<number>      -> number
//     fn:<op>(<arg>)  -> server-side operation executed during hydrate
// Supported ops (legacy "state helpers"):
//     readFile(path)  -> reads a file from the server
//     echo(text)      -> echoes text into state debug
// The fn: mechanism is the intentional gadget chain (C13).
// Legacy state snapshots live in /app/data/state-snapshot.dat and can be
// inspected with the readFile helper during incident triage.
// ============================================================

const fs = require('fs');

function pack(obj) {
  let raw = '';
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') raw += `${k}=n:${v};`;
    else if (typeof v === 'string') raw += `${k}=s:${v};`;
  }
  return Buffer.from(raw).toString('base64');
}

function hydrate(encoded) {
  const state = { __raw: encoded, debug: [] };
  let raw;
  try {
    raw = Buffer.from(String(encoded), 'base64').toString('utf8');
  } catch {
    return null;
  }
  for (const pair of raw.split(';')) {
    if (!pair.includes('=')) continue;
    const idx = pair.indexOf('=');
    const key = pair.slice(0, idx);
    let val = pair.slice(idx + 1);
    if (val.startsWith('n:')) {
      state[key] = Number(val.slice(2));
    } else if (val.startsWith('fn:')) {
      // DANGEROUS: executes server-side op from untrusted cookie
      const m = val.slice(3).match(/^(\w+)\((.*)\)$/);
      if (m) {
        const [, op, arg] = m;
        try {
          if (op === 'readFile') {
            state.debug.push(`[readFile ${arg}] ` + fs.readFileSync(arg, 'utf8'));
          } else if (op === 'echo') {
            state.debug.push(`[echo] ${arg}`);
          } else {
            state.debug.push(`[unknown op] ${op}`);
          }
        } catch (e) {
          state.debug.push(`[error] ${e.message}`);
        }
      }
      state[key] = val;
    } else {
      state[key] = val.replace(/^s:/, '');
    }
  }
  return state;
}

module.exports = { pack, hydrate };
