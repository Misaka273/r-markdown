<script setup lang="ts"></script>

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

/* ── Header Blur ── */
.header-blur {
  background: linear-gradient(
    to bottom,
    rgba(245, 245, 247, 0.98) 0%,
    rgba(245, 245, 247, 0.6) 70%,
    rgba(245, 245, 247, 0) 100%
  );
}

[data-theme='dark'] .header-blur {
  background: linear-gradient(
    to bottom,
    rgba(17, 17, 20, 0.98) 0%,
    rgba(17, 17, 20, 0.6) 70%,
    rgba(17, 17, 20, 0) 100%
  );
}
</style>
