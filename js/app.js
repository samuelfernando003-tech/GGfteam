// js/app.js - Lógica principal do site
import { 
  db, COLLECTIONS, 
  collection, doc, getDoc, getDocs, 
  query, orderBy, where,
  ref, getDownloadURL
} from './firebase-config.js';

// Estado global da aplicação
const AppState = {
  config: null,
  products: [],
  faq: [],
  ads: [],
  categories: new Set()
};

// ============================================
// INICIALIZAÇÃO E CARREGAMENTO DE DADOS
// ============================================

async function loadStoreData() {
  try {
    showLoader(true);
    
    // Carrega configurações
    const configDoc = await getDoc(doc(db, COLLECTIONS.CONFIG, 'settings'));
    if (configDoc.exists()) {
      AppState.config = configDoc.data();
      applySettings(AppState.config);
    }
    
    // Carrega produtos ordenados
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS), 
      orderBy('order', 'asc')
    );
    const productsSnapshot = await getDocs(productsQuery);
    AppState.products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Extrai categorias únicas
    AppState.products.forEach(p => {
      if (p.category) AppState.categories.add(p.category);
    });
    
    // Carrega FAQ ordenado
    const faqQuery = query(
      collection(db, COLLECTIONS.FAQ), 
      orderBy('order', 'asc')
    );
    const faqSnapshot = await getDocs(faqQuery);
    AppState.faq = faqSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Carrega anúncios ativos
    const adsQuery = query(
      collection(db, COLLECTIONS.ADS),
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    const adsSnapshot = await getDocs(adsQuery);
    AppState.ads = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Renderiza tudo
    renderProducts(AppState.products);
    renderCategoriesFilter();
    renderFAQ(AppState.faq);
    renderAds(AppState.ads);
    updateSalesCounter();
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showError('Erro ao carregar produtos. Tente novamente.');
  } finally {
    showLoader(false);
  }
}

// ============================================
// APLICAÇÃO DE CONFIGURAÇÕES
// ============================================

function applySettings(settings) {
  // Aplica cores CSS
  document.documentElement.style.setProperty('--cor-destaque-primaria', settings.color_primary || '#FF073A');
  document.documentElement.style.setProperty('--cor-texto-secundaria', settings.color_secondary || '#F0F0F0');
  document.documentElement.style.setProperty('--cor-fundo-card', settings.header_background_color || '#1A0000');
  
  // Atualiza slogan
  const sloganElement = document.getElementById('slogan-texto');
  if (sloganElement && settings.slogan) {
    typeWriterEffect(sloganElement, settings.slogan);
  }
  
  // Atualiza banner
  const banner = document.querySelector('.page-banner');
  if (banner && settings.banner_image_url) {
    banner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${settings.banner_image_url}')`;
  }
  
  // Atualiza link WhatsApp
  const whatsappNumber = settings.whatsapp_number || '558496833932';
  const whatsappFloat = document.querySelector('.whatsapp-float');
  if (whatsappFloat) {
    whatsappFloat.href = `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de saber mais sobre os produtos da GGF Store.`;
  }
}

// ============================================
// RENDERIZAÇÃO DE PRODUTOS
// ============================================

function renderProducts(products) {
  const container = document.getElementById('lista-produtos-js');
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>Nenhum produto encontrado</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = products.map((product, index) => {
    const badge = getProductBadge(product);
    const imageUrl = product.imgSrc || 'https://via.placeholder.com/300x300/1a0000/ff073a?text=GGF+Store';
    
    return `
      <a href="${product.link || '#'}" class="card-produto animate-on-scroll" 
         style="animation-delay: ${index * 0.1}s"
         ${!product.link ? 'onclick="return false;"' : ''}>
        <div class="product-image-wrapper">
          <img src="${imageUrl}" alt="${product.titulo}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/300x300/1a0000/ff073a?text=GGF+Store'">
          ${badge ? `<span class="product-badge ${badge.type}">${badge.text}</span>` : ''}
        </div>
        <div class="card-info">
          <div class="product-header">
            <h4>${product.titulo}</h4>
            <span class="product-category">${product.category || 'Geral'}</span>
          </div>
          <p>${product.descricao || 'Produto disponível para compra.'}</p>
          <div class="product-footer">
            <span class="product-price">${product.price || 'Sob Consulta'}</span>
            <span class="buy-button">
              <i class="fas fa-shopping-cart"></i> Comprar
            </span>
          </div>
        </div>
      </a>
    `;
  }).join('');
  
  // Re-inicializa animações
  initScrollAnimations();
}

function getProductBadge(product) {
  if (product.badge === 'new') {
    return { type: 'new', text: '🔥 NOVO' };
  }
  if (product.badge === 'sale') {
    return { type: 'sale', text: '🏷️ OFERTA' };
  }
  if (product.badge === 'popular') {
    return { type: 'popular', text: '⭐ POPULAR' };
  }
  
  // Badge automática para produtos recentes (menos de 7 dias)
  if (product.createdAt) {
    const created = product.createdAt.toDate();
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
      return { type: 'new', text: '🆕 NOVO' };
    }
  }
  
  return null;
}

// ============================================
// FILTRO DE CATEGORIAS
// ============================================

function renderCategoriesFilter() {
  const filterContainer = document.getElementById('category-filters');
  if (!filterContainer) return;
  
  const categories = ['Todos', ...Array.from(AppState.categories).sort()];
  
  filterContainer.innerHTML = categories.map(cat => `
    <button class="category-btn ${cat === 'Todos' ? 'active' : ''}" 
            data-category="${cat}">
      ${cat}
    </button>
  `).join('');
  
  // Adiciona eventos
  filterContainer.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const category = btn.dataset.category;
      const filtered = category === 'Todos' 
        ? AppState.products 
        : AppState.products.filter(p => p.category === category);
      
      renderProducts(filtered);
    });
  });
}

// ============================================
// BUSCA DE PRODUTOS
// ============================================

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.getElementById('search-container');
  
  if (!searchInput || !searchToggle || !searchContainer) return;
  
  searchToggle.addEventListener('click', (e) => {
    e.preventDefault();
    searchContainer.classList.toggle('open');
    if (searchContainer.classList.contains('open')) {
      searchInput.focus();
    }
  });
  
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const term = e.target.value.toLowerCase().trim();
      
      if (term === '') {
        renderProducts(AppState.products);
        return;
      }
      
      const filtered = AppState.products.filter(p => 
        p.titulo.toLowerCase().includes(term) ||
        (p.descricao && p.descricao.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
      
      renderProducts(filtered);
    }, 300);
  });
}

// ============================================
// RENDERIZAÇÃO DE FAQ
// ============================================

function renderFAQ(faqItems) {
  const container = document.getElementById('faq-container');
  if (!container) return;
  
  container.innerHTML = faqItems.map((item, index) => `
    <details class="faq-item animate-on-scroll" style="animation-delay: ${index * 0.1}s">
      <summary>${item.question}</summary>
      <div class="faq-answer">
        <p>${item.answer}</p>
      </div>
    </details>
  `).join('');
  
  initScrollAnimations();
}

// ============================================
// RENDERIZAÇÃO DE ANÚNCIOS
// ============================================

function renderAds(ads) {
  const container = document.getElementById('ads-list-js');
  const section = document.getElementById('ads-section');
  
  if (!container) return;
  
  if (ads.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  
  if (section) section.style.display = 'block';
  
  container.innerHTML = ads.map((ad, index) => `
    <a href="${ad.targetLink || '#'}" 
       class="ad-banner animate-on-scroll" 
       target="_blank"
       style="animation-delay: ${index * 0.2}s">
      <img src="${ad.imageUrl}" alt="${ad.title}" loading="lazy"
           onerror="this.style.display='none'">
    </a>
  `).join('');
  
  initScrollAnimations();
}

// ============================================
// CONTADOR DE VENDAS
// ============================================

function updateSalesCounter() {
  const counterElement = document.getElementById('sales-counter');
  if (!counterElement || !AppState.config) return;
  
  const totalSales = AppState.config.total_sales || 1547;
  
  // Animação de contagem
  let current = 0;
  const target = totalSales;
  const duration = 2000;
  const step = target / (duration / 16);
  
  function updateCounter() {
    current += step;
    if (current >= target) {
      counterElement.textContent = target.toLocaleString();
      return;
    }
    counterElement.textContent = Math.floor(current).toLocaleString();
    requestAnimationFrame(updateCounter);
  }
  
  requestAnimationFrame(updateCounter);
}

// ============================================
// UTILITÁRIOS
// ============================================

function typeWriterEffect(element, text) {
  if (!element) return;
  
  element.textContent = '';
  let i = 0;
  const speed = 70;
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

function showLoader(show) {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

function showError(message) {
  // Implementar toast de erro
  console.error(message);
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadStoreData();
  setupSearch();
  setupMenu();
  initScrollAnimations();
});

function setupMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar-menu');
  const overlay = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('close-sidebar');
  
  if (!menuToggle || !sidebar) return;
  
  const openMenu = () => {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  const closeMenu = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  menuToggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);
}

// Listener para atualizações em tempo real (opcional)
export function setupRealtimeUpdates() {
  // Implementar listeners do Firestore para atualizações em tempo real
  console.log('Realtime updates configurado');
                                      }
