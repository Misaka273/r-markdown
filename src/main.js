import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { preloadMathJax } from './utils/mathRenderer';
import './styles/style.css';
// 预加载 MathJax CDN，减少首次渲染公式的等待
preloadMathJax();
createApp(App).use(router).mount('#app');
