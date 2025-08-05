<script>
  // Game session state
  let gameId = '';
  let boardText = '';
  let message = '';
  let command = '';
  let status = '';
  let loading = false;

  // Create a new game on mount
  onMount(async () => {
    loading = true;
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width: 9, height: 9, bombPercentage: 15 })
      });
      const data = await res.json();
      gameId = data.id;
      await fetchBoard();
    } finally {
      loading = false;
    }
  });

  // Fetch board state as CLI text
  async function fetchBoard() {
    const res = await fetch(`/api/game/${gameId}`);
    const data = await res.json();
    // Use initial board rendering endpoint for first render
    const boardRes = await fetch(`/api/game/${gameId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: '' })
    });
    const boardData = await boardRes.json();
    boardText = boardData.boardText || '';
    message = boardData.message || '';
    status = boardData.status || '';
  }

  // Handle CLI command submit
  async function submitCommand(e) {
    e.preventDefault();
    if (!command.trim()) return;
    loading = true;
    try {
      const res = await fetch(`/api/game/${gameId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      boardText = data.boardText;
      message = data.message;
      status = data.status;
      command = '';
    } finally {
      loading = false;
    }
  }

  import { onMount } from 'svelte';
</script>

<main>
  <h1>Minesweeper Web CLI</h1>
  <pre style="background:#222;color:#eee;padding:1em;border-radius:8px;text-align:left;max-width:fit-content;margin:1em auto;font-size:1.1em;line-height:1.3;">{boardText}</pre>
  <form on:submit|preventDefault={submitCommand} style="margin:1em auto;max-width:320px;display:flex;gap:0.5em;">
    <input
      type="text"
      bind:value={command}
      placeholder="Enter command (e.g. A1, F B2, Q)"
      disabled={loading || status !== 'PLAYING'}
      style="flex:1;padding:0.5em;font-size:1em;"
      autocomplete="off"
      autofocus
    />
    <button type="submit" disabled={loading || status !== 'PLAYING'}>Send</button>
  </form>
  <div style="min-height:2em;text-align:center;color:#c33;font-weight:bold;">{message}</div>
  {#if status && status !== 'PLAYING'}
    <div style="text-align:center;margin-top:1em;">
      <strong>Game Over: {status}</strong>
      <br />
      <button on:click={() => location.reload()} style="margin-top:0.5em;">New Game</button>
    </div>
  {/if}
</main>

<style>
  main {
    text-align: center;
    margin-top: 2rem;
    font-family: system-ui, monospace;
  }
  input[type="text"] {
    border: 1px solid #aaa;
    border-radius: 4px;
    background: #fff;
  }
  button {
    border-radius: 4px;
    background: #333;
    color: #fff;
    border: none;
    padding: 0.5em 1em;
    cursor: pointer;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
