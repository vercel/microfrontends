'use client';

import { useState } from 'react';
import { runServerAction } from './actions';

export function ClientButton() {
  const [serverResponse, setServerResponse] = useState<string | null>(null);
  async function onClick() {
    setServerResponse(await runServerAction());
  }
  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <button onClick={onClick} type="button">
        Run Server Action
      </button>
      <div>
        {serverResponse
          ? serverResponse
          : 'This content should be replaced with server response after click.'}
      </div>
    </>
  );
}
