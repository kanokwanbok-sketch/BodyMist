/* ==========================================================================
   BODY SCENT - Shared Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initProductPage();
  initOrderPage();
  initAdminPage();
});

/* ==========================================================================
   0. Mobile Navigation Toggle (ใช้ร่วมกันทุกหน้า)
   ========================================================================== */
function initMobileNav() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.backgroundColor = 'var(--bg-primary)';
        navLinks.style.padding = '24px 5%';
        navLinks.style.borderBottom = '1px solid var(--border-light)';
        navLinks.style.gap = '20px';
      }
    });
  }
}

/* ==========================================================================
   1. หน้าสินค้า (product.html)
      - โหลด products.json
      - สร้างปุ่มกรองตาม Mood (#filter-bar) และรองรับ URL parameter ?mood=xxx
      - แสดงการ์ดสินค้า (#product-list) พร้อมปุ่มสั่งซื้อส่งค่าไปยัง order.html
   ========================================================================== */
function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productList = document.getElementById('product-list');

  // ทำงานเฉพาะเมื่ออยู่ในหน้า product.html
  if (!filterBar || !productList) return;

  let allProducts = [];

  const moods = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'fresh', label: 'Fresh' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'confident', label: 'Confident' },
    { key: 'romance', label: 'Romance' }
  ];

  // อ่านค่า ?mood=xxx จาก URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialMoodParam = (urlParams.get('mood') || 'all').toLowerCase();
  const validMoods = moods.map(m => m.key);
  let activeMood = validMoods.includes(initialMoodParam) ? initialMoodParam : 'all';

  // สร้างปุ่ม Filter
  function renderFilterButtons() {
    filterBar.innerHTML = moods
      .map(m => {
        const isActive = m.key === activeMood ? 'active' : '';
        const dotHtml = m.key !== 'all' ? `<span class="mood-dot ${m.key}"></span>` : '';
        return `
          <button type="button" class="filter-btn ${isActive}" data-mood="${m.key}">
            ${dotHtml}
            <span>${m.label}</span>
          </button>
        `;
      })
      .join('');

    // ผูก Event คลิกปุ่ม Filter
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMood = btn.dataset.mood;

        // อัปเดตสถานะ active บนปุ่ม
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // อัปเดต URL parameter โดยไม่รีโหลดหน้า
        const newUrl = new URL(window.location);
        if (activeMood === 'all') {
          newUrl.searchParams.delete('mood');
        } else {
          newUrl.searchParams.set('mood', activeMood);
        }
        window.history.replaceState({}, '', newUrl);

        renderProducts();
      });
    });
  }

  // แสดงรายการการ์ดสินค้า
  function renderProducts() {
    const filtered = activeMood === 'all'
      ? allProducts
      : allProducts.filter(p => p.mood.toLowerCase() === activeMood);

    if (filtered.length === 0) {
      productList.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color: var(--text-secondary);">ไม่พบสินค้าในหมวดหมู่นี้</p>`;
      return;
    }

    productList.innerHTML = filtered
      .map(product => {
        // สร้างชื่อรายการพร้อมไซส์สำหรับส่งไปหน้าสั่งซื้อ เช่น "น้ำหอมฉีดตัว Fresh เล็ก 30ml"
        const sizeLabel = product.type === 'spray'
          ? (product.size === '30ml' ? `เล็ก ${product.size}` : `ใหญ่ ${product.size}`)
          : product.size;

        const fullItemName = `${product.name} ${sizeLabel}`.trim();
        const orderUrl = `order.html?item=${encodeURIComponent(fullItemName)}&price=${encodeURIComponent(product.price)}`;

        return `
          <article class="product-card">
            <div class="product-img-box">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(fullItemName)}" loading="lazy">
            </div>
            <div class="product-meta">
              <span class="product-mood-tag">
                <span class="mood-dot ${escapeHtml(product.mood)}"></span>
                ${escapeHtml(product.mood)}
              </span>
              <span>${escapeHtml(product.size)}</span>
            </div>
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <p class="product-desc">${escapeHtml(product.description || '')}</p>
            <div class="product-footer">
              <span class="product-price">฿${Number(product.price).toLocaleString()}</span>
              <a href="${orderUrl}" class="btn btn-sm">สั่งซื้อ</a>
            </div>
          </article>
        `;
      })
      .join('');
  }

  // ดึงข้อมูลจาก products.json
  fetch('products.json')
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      return response.json();
    })
    .then(data => {
      allProducts = data;
      renderFilterButtons();
      renderProducts();
    })
    .catch(err => {
      console.error(err);
      productList.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color: var(--text-secondary);">เกิดข้อผิดพลาดในการโหลดรายการสินค้า</p>`;
    });
}

/* ==========================================================================
   2. หน้าสั่งซื้อ (order.html)
      - รับค่า ?item=...&price=... จาก URL มาใส่ใน #items และ #total อัตโนมัติ
      - ส่งข้อมูลฟอร์ม #orderForm ไปยัง Google Apps Script
   ========================================================================== */
function initOrderPage() {
  const orderForm = document.getElementById('orderForm');

  // ทำงานเฉพาะเมื่ออยู่ในหน้า order.html
  if (!orderForm) return;

  const customerNameInput = document.getElementById('customerName');
  const contactInput = document.getElementById('contact');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');
  const noteInput = document.getElementById('note');

  // ดึงค่า item และ price จาก URL parameter มาเติมให้อัตโนมัติ
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  if (itemParam && itemsInput && !itemsInput.value) {
    itemsInput.value = `${itemParam} x 1`;
  }
  if (priceParam && totalInput && !totalInput.value) {
    totalInput.value = priceParam;
  }

  // จัดการการ Submit ฟอร์ม
  orderForm.addEventListener('submit', e => {
    e.preventDefault();

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    const payload = {
      customerName: customerNameInput ? customerNameInput.value.trim() : '',
      contact: contactInput ? contactInput.value.trim() : '',
      items: itemsInput ? itemsInput.value.trim() : '',
      total: totalInput ? totalInput.value.trim() : '',
      note: noteInput ? noteInput.value.trim() : ''
    };

    fetch('https://script.google.com/macros/s/AKfycbydWEZFRo9XRnXuWmFph3De0cO9C5hlc6ADyuwCjp-HQHUV83ZYm2J9UmFR-LxYzpiS/exec', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
  });
}

/* ==========================================================================
   3. หน้าแอดมิน (admin.html)
      - ดึง CSV จาก Google Sheets
      - Parse CSV ด้วยฟังก์ชันที่เขียนเอง (รองรับเครื่องหมายคำพูด "..." และขึ้นบรรทัดใหม่ในช่อง)
      - แสดงใน #ordersTable tbody โดยเรียงจากรายการล่าสุดขึ้นก่อน
   ========================================================================== */
function initAdminPage() {
  const tableBody = document.querySelector('#ordersTable tbody');

  // ทำงานเฉพาะเมื่ออยู่ในหน้า admin.html
  if (!tableBody) return;

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjsff-W9KjZmJOXnlR7thveaO5T_bK4QaLs49kQNJ2thEB7jLwVF0JjN54F_kDg7Tevyk-452QNWxb/pub?gid=0&single=true&output=csv';

  tableBody.innerHTML = `<tr><td colspan="6" class="text-center">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>`;

  fetch(CSV_URL)
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
      return response.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);

      // ตัดแถว Header ออก (แถวแรก) และกรองแถวว่างทิ้ง
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== ''));

      if (dataRows.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">ยังไม่มีรายการสั่งซื้อ</td></tr>`;
        return;
      }

      // เรียงจากรายการล่าสุดขึ้นก่อน (แถวล่างสุดใน Sheet คือรายการล่าสุด)
      const latestFirstRows = dataRows.reverse();

      tableBody.innerHTML = latestFirstRows
        .map(row => {
          const timestamp = row[0] || '-';
          const customerName = row[1] || '-';
          const contact = row[2] || '-';
          const items = row[3] || '-';
          const total = row[4] ? `${Number(row[4]).toLocaleString()} บาท` : '-';
          const note = row[5] || '-';

          return `
            <tr>
              <td>${escapeHtml(timestamp)}</td>
              <td>${escapeHtml(customerName)}</td>
              <td>${escapeHtml(contact)}</td>
              <td>${escapeHtml(items)}</td>
              <td>${escapeHtml(total)}</td>
              <td>${escapeHtml(note)}</td>
            </tr>
          `;
        })
        .join('');
    })
    .catch(error => {
      console.error(error);
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    });
}

/* ==========================================================================
   Helper Functions: Custom CSV Parser & HTML Escaping
   ========================================================================== */

/**
 * แปลงข้อความ CSV เป็น Array 2 มิติโดยไม่ใช้ Library ภายนอก
 * รองรับค่าที่มีเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่ภายในเครื่องหมายคำพูด ("...")
 */
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuotes = false;

  // ปรับบรรทัดให้เป็นมาตรฐาน \n
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    const nextChar = normalizedText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // เครื่องหมาย "" ภายใน quotes คือตัวอักษร " 1 ตัว
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  // เก็บค่าสุดท้ายที่เหลืออยู่
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  return rows;
}

/**
 * ป้องกัน XSS เมื่อนำข้อความจาก JSON / CSV มาแสดงผลใน HTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''');
}