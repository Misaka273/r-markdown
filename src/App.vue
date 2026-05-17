<script setup lang="ts">
</script>

<template>
  <router-view />
</template>

<style>
/* ── Toolbar ── */
.toolbar {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

/* ── Panel Header ── */
.panel-header {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.panel-header-muted {
  color: var(--text-muted);
}

/* ── Resize Handle ── */
.resize-handle {
  width: 5px;
  background: transparent;
  cursor: col-resize;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  border-left: none;
  border-right: none;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: var(--text-muted);
  border-radius: 1px;
  transition:
    background 0.2s,
    width 0.2s;
}

.resize-handle:hover {
  background: transparent;
}

.resize-handle:hover::after,
.resize-handle:active::after {
  background: var(--accent);
  width: 3px;
}

/* ── Toast ── */
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  padding: 12px 24px;
  background: var(--text-primary);
  color: var(--bg-primary);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow:
    rgba(0, 0, 0, 0.04) 0px 4px 18px,
    rgba(0, 0, 0, 0.027) 0px 2px 8px;
  transition: transform 0.3s ease;
  z-index: 1000;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
}
</style>
