/**
 * Side Cart (سلة تسوق جانبية) - Render, remove, update qty, coupon
 * Depends: jQuery, Bootstrap 5 Offcanvas, zid.cart API
 */
(function () {
  'use strict';

  var $ = window.jQuery;
  if (!$) return;

  function getSideCartEl() {
    return document.getElementById('side-cart');
  }

  var rtlMode = $('body').hasClass('rtl') || document.documentElement.getAttribute('dir') === 'rtl';

  function getDataLabel(attr, fallback) {
    var el = getSideCartEl();
    var val = el ? el.getAttribute('data-' + attr) : null;
    return (val != null && val !== '') ? val : (fallback != null ? fallback : '');
  }

  function getEmptyText() {
    return getDataLabel('empty', rtlMode ? 'السلة فارغة' : 'Cart is empty');
  }

  function getProductImage(product) {
    var img = '';
    if (product.images && product.images[0]) {
      img = product.images[0].origin || product.images[0].url || (product.images[0].image && product.images[0].image.medium) || '';
    }
    if (!img && product.thumbnail) img = product.thumbnail;
    if (!img && product.image) img = typeof product.image === 'string' ? product.image : (product.image.url || product.image.origin);
    return img || '';
  }

  function getProductUrl(product) {
    return product.url || product.html_url || (product.slug ? '/products/' + product.slug : '#');
  }

  function getProductId(product) {
    return (product.product_id != null ? product.product_id : product.id) + '';
  }

  /** معرف عنصر السلة (UUID) - يُستخدم في DELETE و PATCH لـ /cart/items/{id} */
  function getCartItemId(product) {
    var id = product.id || product.cart_item_id || product.item_id;
    return id != null ? (id + '') : '';
  }

  function buildProductItemHtml(product) {
    var cartItemId = getCartItemId(product);
    var productId = getProductId(product);
    var id = cartItemId || productId;
    var name = (product.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var url = getProductUrl(product);
    var imgSrc = getProductImage(product);
    var qty = Math.max(1, parseInt(product.quantity, 10) || 1);
    var priceStr = product.value_string || product.price_string || product.price_formatted || '';
    var compareStr = product.compare_at_price_string || product.compare_at_price_formatted || '';
    var hasDiscount = compareStr && parseFloat(product.compare_at_price || 0) > parseFloat(product.price || product.value || 0);

    var priceBlock = '';
    if (hasDiscount && priceStr) {
      priceBlock = '<div class="price"><span class="price-discount">' + priceStr + '</span> <del class="old">' + compareStr + '</del></div>';
    } else {
      priceBlock = '<div class="price"><span class="product-price">' + priceStr + '</span></div>';
    }

    var removeLabel = getDataLabel('remove-label', rtlMode ? 'حذف' : 'Remove');
    var safeCartItemId = (cartItemId || id).replace(/'/g, "\\'");
    var itemHtml =
      '<li id="cartitem_' + id.replace(/"/g, '') + '" data-cart-item-id="' + (cartItemId || '') + '">' +
        '<div class="flex-product-box">' +
          '<div class="img-product-box">' +
            '<a href="' + url + '"><img src="' + (imgSrc || '') + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\'"></a>' +
          '</div>' +
          '<div class="product-info-box">' +
            '<button type="button" class="remove" onclick="return window.removeItemFromSideCart(\'' + safeCartItemId + '\', this)" aria-label="' + removeLabel + '">' + removeLabel + '</button>' +
            '<h4 class="title-product-m"><a href="' + url + '">' + name + '</a></h4>' +
            '<div class="price-old-new">' + priceBlock + '</div>' +
            '<div class="block-p-qty">' +
              '<button type="button" class="button-minus btn-number" data-type="minus" data-field="quantity_' + safeCartItemId + '" aria-label="-">−</button>' +
              '<input type="number" class="input-number" name="quantity_' + safeCartItemId + '" value="' + qty + '" min="1" max="999" readonly onchange="window.updateMiniCartProduct(\'' + safeCartItemId + '\', this.value)">' +
              '<button type="button" class="button-plus btn-number" data-type="plus" data-field="quantity_' + safeCartItemId + '" aria-label="+">+</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</li>';
    return itemHtml;
  }

  function renderProducts(cart, listEl) {
    var products = cart.products || cart.items || cart.cart_products || [];
    if (!Array.isArray(products)) products = [];
    listEl.innerHTML = '';
    products.forEach(function (product) {
      var bundleProducts = product.bundle_products || product.product_x || product.product_y;
      if (bundleProducts && Array.isArray(bundleProducts)) {
        bundleProducts.forEach(function (p) {
          listEl.insertAdjacentHTML('beforeend', buildProductItemHtml(p));
        });
      } else {
        listEl.insertAdjacentHTML('beforeend', buildProductItemHtml(product));
      }
    });
  }

  function renderTotals(cart, listId) {
    var list = document.getElementById(listId);
    if (!list) return;
    var totals = cart.totals || [];
    var html = '';
    totals.forEach(function (t) {
      var code = (t.code || '').toLowerCase();
      var isTotal = code === 'total';
      var valueClass = 'cart-total-value' + (isTotal ? ' cart-total-final' : '');
      var title = (t.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var valueStr = (t.value_string || t.value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<div class="cart-totals-row-wrapper" data-total-row="' + (t.code || '') + '">' +
        '<div class="flex-grow-1">' + title + '</div>' +
        '<div class="flex-shrink-0 ' + valueClass + '" data-total="' + (t.code || '') + '">' + valueStr + '</div>' +
        '</div>';
    });
    if (!totals.length && (cart.total_string || cart.grand_total)) {
      var totalLabel = getDataLabel('total-label', rtlMode ? 'الإجمالي' : 'Total');
      var totalVal = (cart.total_string || cart.grand_total || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html = '<div class="cart-totals-row-wrapper" data-total-row="total">' +
        '<div class="flex-grow-1">' + totalLabel + '</div>' +
        '<div class="flex-shrink-0 cart-total-value cart-total-final" data-total="total">' + totalVal + '</div>' +
        '</div>';
    }
    list.innerHTML = html;
  }

  function waitForZid(maxWaitMs) {
    maxWaitMs = maxWaitMs || 8000;
    return new Promise(function (resolve) {
      if (typeof window.zid !== 'undefined' && window.zid.products && typeof window.zid.products.list === 'function') {
        resolve();
        return;
      }
      var start = Date.now();
      var t = setInterval(function () {
        if (typeof window.zid !== 'undefined' && window.zid.products && typeof window.zid.products.list === 'function') {
          clearInterval(t);
          resolve();
          return;
        }
        if (Date.now() - start >= maxWaitMs) {
          clearInterval(t);
          resolve();
        }
      }, 200);
    });
  }

  function loadSideCartRecommended() {
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var recommendedBlock = document.getElementById('side-cart-recommended');
    if (!recommendedBlock) return;
    var categoryId = (sideCartEl.getAttribute('data-recommended-category-id') || '').trim();
    if (!categoryId || categoryId === 'None') {
      recommendedBlock.classList.add('d-none');
      return;
    }
    var titleEl = recommendedBlock.querySelector('.side-cart-recommended-title');
    var titleText = sideCartEl.getAttribute('data-recommended-title') || (rtlMode ? 'قد يعجبك أيضاً' : 'You might also like');
    if (titleEl) titleEl.textContent = titleText;
    recommendedBlock.classList.remove('d-none');

    var loader = recommendedBlock.querySelector('.side-cart-recommended-loading');
    var sliderEl = recommendedBlock.querySelector('.side-cart-recommended-slider');
    if (!sliderEl) return;
    var defaultImg = recommendedBlock.getAttribute('data-default-product-image') || '';

    waitForZid(8000).then(function () {
      if (typeof window.zid === 'undefined' || !window.zid.products || typeof window.zid.products.list !== 'function') {
        if (loader) loader.textContent = rtlMode ? 'فشل تحميل المنتجات' : 'Failed to load products';
        return;
      }
      var listPromise = window.zid.products.list({ categories: categoryId, page_size: 20 }, { showErrorNotification: false });
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('timeout')); }, 15000);
      });
      Promise.race([listPromise, timeoutPromise])
        .then(function (response) {
          var products = [];
          if (response && Array.isArray(response.results)) products = response.results;
          else if (response && Array.isArray(response.products)) products = response.products;
          else if (Array.isArray(response)) products = response;
          else if (response && response.data) {
            var d = response.data;
            if (Array.isArray(d.results)) products = d.results;
            else if (Array.isArray(d.products)) products = d.products;
            else if (Array.isArray(d)) products = d;
          }
          if (!products || products.length === 0) {
            if (loader) loader.textContent = rtlMode ? 'لا توجد منتجات في هذا التصنيف' : 'No products in this category';
            return;
          }
          if (loader) loader.remove();
          if (typeof $ !== 'undefined' && $.fn.slick && $(sliderEl).hasClass('slick-initialized')) {
            $(sliderEl).slick('unslick');
          }
          sliderEl.innerHTML = '<div class="swiper-wrapper"></div><div class="swiper-button-next"></div><div class="swiper-button-prev"></div>';
          sliderEl.classList.add('swiper');
          var swiperWrapper = sliderEl.querySelector('.swiper-wrapper');
          var reviewsEnabled = $('aside#side-cart').data('reviews-enabled') !== false;

          function buildRatingHtml(ratingObj) {
            if (!reviewsEnabled) return '';
            ratingObj = ratingObj || {};
            const totalCount = ratingObj.total_count || 0;
            const avg = ratingObj.average || 0;
            const ratingRounded = Math.ceil((avg * 2)) / 2;
            let stars = '';
            if (totalCount > 0) {
              for (let n = 1; n <= 5; n++) {
                if (n <= ratingRounded) {
                  stars += '<span class="icon-star1"></span>';
                } else if (n <= ratingRounded + 0.5) {
                  stars += '<span class="icon-half-star"></span>';
                } else {
                  stars += '<span class="icon-star1 deactive"></span>';
                }
              }
            }
            return '' +
              '<div class="outlit-product-card__rating">' +
                '<span class="product-card-rating-count">(' + totalCount + ')</span>' +
                (totalCount > 0 ? 
                '<div class="d-inline-flex product-card-rating" data-rating="' + avg + '">' +
                  stars +
                '</div>' : '') +
                '<span class="outlit-product-card__rating-value">' + (avg ? avg.toFixed(1) : '0.0') + '</span>' +
              '</div>';
          }

          sliderEl.style.display = 'block';

          var addToCartLabel = rtlMode ? 'أضف للسلة' : 'Add to cart';
          products.forEach(function (product) {
            var productImages = Array.isArray(product.images) ? product.images : [];
            var mainImgObj = product.main_image && product.main_image.image ? product.main_image.image : null;
            var firstImgObj = productImages[0] && productImages[0].image ? productImages[0].image : null;
            var mainImg = (mainImgObj && (mainImgObj.small || mainImgObj.medium || mainImgObj.large)) ||
              (firstImgObj && (firstImgObj.small || firstImgObj.medium || firstImgObj.large)) ||
              defaultImg;
            var productName = (product.name || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var slugForUrl = (product.slug || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var productId = String(product.id || '');
            var formattedPrice = product.formatted_sale_price || product.formatted_price || '';
            var hasSalePrice = !!product.formatted_sale_price;
            var hasOptions = product.has_options || product.has_fields || product.product_class === 'dynamic_bundle' ||
              (product.options && product.options.length > 0) || (product.variants && product.variants.length > 0);
            var outOfStock = !product.is_infinite && product.quantity <= 0;

            var priceHtml = '<div class="outlit-product-card__price-wrap">';
            if (hasSalePrice) {
              priceHtml += '<div class="outlit-product-card__price-row">';
              if (product.discount_percentage) priceHtml += '<span class="outlit-product-card__discount">-' + (product.discount_percentage || '') + '%</span>';
              priceHtml += '<span class="outlit-product-card__price outlit-product-card__price--old">' + (product.formatted_price || '') + '</span>';
              priceHtml += '<span class="outlit-product-card__price outlit-product-card__price--current">' + formattedPrice + '</span></div>';
            } else {
              priceHtml += '<span class="outlit-product-card__price outlit-product-card__price--current">' + formattedPrice + '</span>';
            }
            priceHtml += '</div>';

            var categoryHtml = '';
            if (Array.isArray(product.categories) && product.categories.length > 0) {
              const lastCat = product.categories[product.categories.length - 1];
              const catName = (lastCat && lastCat.name) ? (typeof lastCat.name === 'string' ? lastCat.name : (lastCat.name.ar || lastCat.name.en || '')) : '';
              if (catName && lastCat.id && lastCat.slug) {
                categoryHtml =
                  '<p class="outlit-product-card__category">' +
                    '<a href="/categories/' + lastCat.id + '/' + (lastCat.slug || '') + '">' + catName + '</a>' +
                  '</p>';
              }
            } else if (product.category && product.category.name) {
              categoryHtml = '<p class="outlit-product-card__category">' + product.category.name + '</p>';
            }

            var addCartHtml = '';
            if (product.is_infinite || product.quantity > 0) {
              if (hasOptions) {
                addCartHtml = '<a href="/products/' + slugForUrl + '" class="outlit-product-card__add-cart-btn" aria-label="' + addToCartLabel + '"><span class="outlit-product-card__add-cart-icon" aria-hidden="true">&#9881;</span></a>';
              } else {
                addCartHtml = '<div class="outlit-product-card__add-cart-wrap" data-product-id="' + productId + '">' +
                  '<button type="button" class="outlit-product-card__add-cart-btn outlit-product-card__add-cart-btn--ajax" onclick="event.preventDefault(); event.stopPropagation(); if(window.productCartAddToCart) window.productCartAddToCart(this, \'' + productId.replace(/'/g, "\\'") + '\')" aria-label="' + addToCartLabel + '">' +
                  '<span class="outlit-product-card__add-cart-icon" aria-hidden="true">+</span></button></div>';
              }
            } else {
              addCartHtml = '<a href="/products/' + slugForUrl + '" class="btn btn-sm btn-primary">' + (rtlMode ? 'أخبرني عند التوفر' : 'Notify me') + '</a>';
            }

            var slide = document.createElement('div');
            slide.className = 'swiper-slide';

            var article = document.createElement('article');
            article.className = 'outlit-product-card product-item position-relative' + (outOfStock ? ' outlit-product-card--out-of-stock' : '');
            article.setAttribute('itemscope', '');
            article.setAttribute('itemtype', 'https://schema.org/Product');
            article.innerHTML =
              '<div class="outlit-product-card__img-wrap" style="height: var(--outlit-card-img-height, 200px);">' +
                '<a href="/products/' + slugForUrl + '" class="outlit-product-card__img-link" aria-label="' + productName + '">' +
                  '<div class="outlit-product-card__img-inner">' +
                    '<img class="outlit-product-card__img" src="' + mainImg + '" loading="lazy" decoding="async" alt="' + productName + '">' +
                  '</div>' +
                '</a>' +
                '<div class="outlit-product-card__row outlit-product-card__row--rating-cart">' +
                  buildRatingHtml(product.rating) +
                  addCartHtml +
                '</div>' +
              '</div>' +
              '<div class="outlit-product-card__body">' +
                categoryHtml +
                '<h3 class="outlit-product-card__title"><a href="/products/' + slugForUrl + '">' + (product.name || '') + '</a></h3>' +
                priceHtml + 
              '</div>';

            slide.appendChild(article);
            swiperWrapper.appendChild(slide);
          });

          // Initialize Swiper
          if (typeof Swiper !== 'undefined') {
            new Swiper(sliderEl, {
              slidesPerView: 2,
              spaceBetween: 10,
              loop: products.length > 2,
              navigation: {
                nextEl: sliderEl.querySelector('.swiper-button-next'),
                prevEl: sliderEl.querySelector('.swiper-button-prev'),
              },
              breakpoints: {
                576: { slidesPerView: 2, spaceBetween: 12 },
                0: { slidesPerView: 1.5, spaceBetween: 10 }
              }
            });
          }
        })
        .catch(function () {
          if (loader) loader.textContent = rtlMode ? 'فشل تحميل المنتجات' : 'Failed to load products';
        });
    });
  }

  /** قراءة قيمة من condition مع دعم snake_case و camelCase (حسب استجابة الـ API) */
  function getCondVal(cond, keys) {
    if (!cond) return '';
    for (var i = 0; i < keys.length; i++) {
      var v = cond[keys[i]];
      if (v != null && v !== '') return typeof v === 'number' ? String(v) : v;
    }
    return '';
  }

  function renderFreeShipping(cart) {
    var wrap = document.getElementById('side-cart-free-shipping');
    if (!wrap) return;

    var rule = cart.free_shipping_rule;
    var cond = rule && rule.subtotal_condition ? rule.subtotal_condition : null;
    var hasRule = rule && (rule.code || cond);
    if (!hasRule || !cond) {
      wrap.classList.add('d-none');
      return;
    }

    var status = (cond.status || cond.Status || 'min_not_reached') + '';
    var pct = parseFloat(cond.products_subtotal_percentage_from_min || cond.productsSubtotalPercentageFromMin);
    if (isNaN(pct)) pct = 0;
    pct = Math.max(0, Math.min(100, pct));

    var remaining = getCondVal(cond, [
      'remaining', 'remaining_to_min_total_formatted', 'remainingToMinTotalFormatted',
      'remaining_to_min_total', 'remainingToMinTotal'
    ]) || '0';

    var minTotal = getCondVal(cond, [
      'min_total_formatted', 'minTotalFormatted', 'min_string', 'minString'
    ]);

    var maxTotal = getCondVal(cond, [
      'max_total_formatted', 'maxTotalFormatted', 'max_string', 'maxString'
    ]);

    var productsSubtotal = getCondVal(cond, [
      'products_subtotal_formatted', 'productsSubtotalFormatted',
      'products_subtotal', 'productsSubtotal'
    ]);

    /* لا نعرض البلوك لو مفيش شرط شحن مجاني فعّال أو مفيش قيم للعرض */
    var hasMessage = status === 'applied' ||
      (status === 'min_not_reached' && (remaining !== '0' || minTotal)) ||
      ((status === 'max_exceed' || status === 'max_exceeded') && (minTotal || maxTotal));
    if (!hasMessage && status === 'min_not_reached' && !minTotal && remaining === '0') {
      wrap.classList.add('d-none');
      return;
    }

    var msgEl = wrap.querySelector('.free-shipping-rule-message');
    var progressContainer = wrap.querySelector('.free-shipping-progress-container');
    var bar = wrap.querySelector('.free-shipping-rule-progress');
    var currentSubtotalEl = wrap.querySelector('.free-shipping-current-subtotal');
    var minTotalEl = wrap.querySelector('.free-shipping-min-total');
    var readMoreEl = wrap.querySelector('.free-shipping-rule-read-more');

    if (currentSubtotalEl) currentSubtotalEl.textContent = productsSubtotal;
    if (minTotalEl) minTotalEl.textContent = minTotal;

    if (bar) {
      var width = (status === 'max_exceeded' || status === 'max_exceed') ? 100 : pct;
      bar.style.width = width + '%';
    }

    if (progressContainer) {
      if (status === 'min_not_reached' || status === 'max_exceeded' || status === 'max_exceed') {
        progressContainer.classList.remove('d-none');
        progressContainer.classList.add('d-flex');
      } else {
        progressContainer.classList.add('d-none');
        progressContainer.classList.remove('d-flex');
      }
    }

    if (readMoreEl) {
      if (status === 'min_not_reached') {
        readMoreEl.classList.remove('d-none');
      } else {
        readMoreEl.classList.add('d-none');
      }
    }

    if (msgEl) {
      if (status === 'min_not_reached') {
        var addTotalTpl = getDataLabel(
          'free-shipping-add-total',
          rtlMode ? 'أضف منتجات بإجمالي %(total)s للحصول على شحن مجاني' : 'Add products with total of %(total)s to get free shipping'
        );
        msgEl.textContent = addTotalTpl.replace('%(total)s', remaining);
      } else if (status === 'max_exceed' || status === 'max_exceeded') {
        var betweenTpl = getDataLabel(
          'free-shipping-between',
          rtlMode
            ? 'ينطبق الشحن المجاني على إجمالي سلة بين %(min)s و %(max)s'
            : 'Free shipping applies for cart total between %(min)s and %(max)s'
        );
        msgEl.textContent = betweenTpl.replace('%(min)s', minTotal).replace('%(max)s', maxTotal);
      } else if (status === 'applied') {
        var appliedTpl = getDataLabel(
          'free-shipping-applied',
          rtlMode ? 'حصلت على شحن مجاني' : 'Free shipping applied'
        );
        msgEl.textContent = appliedTpl;
      } else {
        msgEl.textContent = '';
      }
    }

    wrap.classList.remove('d-none');
  }

  function updateCouponUI(cart) {
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var form = sideCartEl.querySelector('.side-cart-coupon-form-inner');
    var applied = sideCartEl.querySelector('.side-cart-coupon-applied');
    var codeSpan = sideCartEl.querySelector('.side-cart-coupon-code');
    var msgEl = sideCartEl.querySelector('.side-cart-message-coupon');
    if (!form || !applied) return;

    var coupon = cart.coupon || {};
    var hasCoupon = !!(coupon.code || coupon.coupon_code);
    if (hasCoupon) {
      form.classList.add('d-none');
      applied.classList.remove('d-none');
      if (codeSpan) codeSpan.textContent = coupon.code || coupon.coupon_code || '';
    } else {
      form.classList.remove('d-none');
      applied.classList.add('d-none');
    }
    if (msgEl) {
      msgEl.classList.add('d-none');
      msgEl.textContent = '';
    }
  }

  function renderSideCart(cart) {
    if (!cart) return;
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var emptyBox = sideCartEl.querySelector('#additional-cart');
    var emptyMsg = sideCartEl.querySelector('.empty-cart-message .empty-cart-text');
    var listEl = sideCartEl.querySelector('.side-cart-items');
    var footer = sideCartEl.querySelector('.footer-side-cart');
    var loading = sideCartEl.querySelector('.loading-cart');

    var count = cart.cart_items_quantity ?? cart.products_count ?? 0;
    var isEmpty = !count || count <= 0;

    if (emptyMsg) emptyMsg.textContent = getEmptyText();
    if (emptyBox) emptyBox.classList.toggle('d-none', !isEmpty);
    if (listEl) {
      listEl.classList.toggle('d-none', isEmpty);
      if (!isEmpty) renderProducts(cart, listEl);
    }
    if (footer) footer.classList.toggle('d-none', isEmpty);
    if (!isEmpty) {
      renderTotals(cart, 'cart-side-totals');
      updateCouponUI(cart);
    }
    renderFreeShipping(cart);
    if (loading) loading.classList.add('d-none');

    // Re-bind quantity buttons
    $(listEl).find('.btn-number').off('click').on('click', function () {
      var btn = $(this);
      var type = btn.data('type');
      var field = btn.data('field');
      var input = sideCartEl && sideCartEl.querySelector('input[name="' + field + '"]');
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      if (type === 'plus') val = Math.min(999, val + 1);
      else val = Math.max(1, val - 1);
      input.value = val;
      var cartItemId = (field + '').replace('quantity_', '');
      if (window.updateMiniCartProduct) window.updateMiniCartProduct(cartItemId, val);
    });
  }

  window.renderSideCart = renderSideCart;

  window.removeItemFromSideCart = function (cartItemId, btn) {
    if (!window.zid || !window.zid.cart || !window.zid.cart.removeProduct) return false;
    var $btn = $(btn);
    var origHtml = $btn.html();
    $btn.html('<span class="loader-cart" style="width:18px;height:18px;border-width:2px;display:inline-block;"></span>');
    window.zid.cart.removeProduct({ product_id: cartItemId }, { showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
      })
      .catch(function () {
        $btn.html(origHtml);
      });
    return false;
  };

  window.updateMiniCartProduct = function (cartItemId, quantity) {
    if (!window.zid || !window.zid.cart || !window.zid.cart.updateProduct) return;
    var q = parseInt(quantity, 10);
    if (isNaN(q) || q < 1) return;
    window.zid.cart.updateProduct({ product_id: cartItemId, quantity: q }, { showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
      })
      .catch(function () {
        if (window.zid && window.zid.toaster && window.zid.toaster.showError) {
          window.zid.toaster.showError(getDataLabel('update-quantity-error', rtlMode ? 'فشل تحديث الكمية' : 'Failed to update quantity'));
        }
      });
  };

  window.sendSideCartCoupon = function () {
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var input = sideCartEl.querySelector('.side-cart-coupon-input');
    var applyBtn = sideCartEl.querySelector('.side-cart-coupon-apply');
    var code = input && input.value ? input.value.trim() : '';
    if (!code || !window.zid || !window.zid.cart || !window.zid.cart.applyCoupon) return;
    var $btn = $(applyBtn);
    var textSpan = applyBtn.querySelector('.side-cart-coupon-apply-text');
    var spinner = applyBtn.querySelector('.side-cart-coupon-spinner');
    if ($btn.hasClass('disabled') || (spinner && !spinner.classList.contains('d-none'))) return;
    if (textSpan) textSpan.classList.add('d-none');
    if (spinner) spinner.classList.remove('d-none');
    $btn.addClass('disabled');
    window.zid.cart.applyCoupon({ coupon_code: code }, { showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
        if (window.zid.toaster && window.zid.toaster.showSuccess) window.zid.toaster.showSuccess(getDataLabel('coupon-applied', rtlMode ? 'تم تطبيق الكوبون' : 'Coupon applied'));
      })
      .catch(function () {})
      .finally(function () {
        if (textSpan) textSpan.classList.remove('d-none');
        if (spinner) spinner.classList.add('d-none');
        $btn.removeClass('disabled');
      });
  };

  window.deleteSideCartCoupon = function () {
    if (!window.zid || !window.zid.cart || !window.zid.cart.removeCoupons) return;
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var removeBtn = sideCartEl.querySelector('.side-cart-coupon-remove');
    var spinner = removeBtn && removeBtn.querySelector('.delete-coupon-progress');
    if (spinner) spinner.classList.remove('d-none');
    window.zid.cart.removeCoupons({ showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
      })
      .finally(function () {
        if (spinner) spinner.classList.add('d-none');
      });
  };

  // فتح/إغلاق السلة يدوياً (Bootstrap 4 لا يدعم Offcanvas)
  var backdropId = 'side-cart-backdrop';
  window.openSideCart = function () {
    var el = getSideCartEl();
    if (!el) return;
    if (typeof closeSlidingMenu === 'function') closeSlidingMenu();
    el.classList.add('show');
    document.body.classList.add('side-cart-open');
    var back = document.getElementById(backdropId);
    if (!back) {
      back = document.createElement('div');
      back.id = backdropId;
      back.className = 'side-cart-backdrop';
      back.setAttribute('aria-hidden', 'true');
      document.body.appendChild(back);
      $(back).on('click', function () { window.closeSideCart(); });
    }
    back.classList.add('show');
    var loading = el.querySelector('.loading-cart');
    if (loading) loading.classList.remove('d-none');
    if (window.fetchCart) window.fetchCart();
    loadSideCartRecommended();
  };

  window.closeSideCart = function () {
    var el = getSideCartEl();
    if (el) {
      el.classList.remove('show');
      var list = el.querySelector('.side-cart-items');
      var footer = el.querySelector('.footer-side-cart');
      var loading = el.querySelector('.loading-cart');
      if (list) list.innerHTML = '';
      if (footer) footer.classList.add('d-none');
      if (loading) loading.classList.remove('d-none');
    }
    document.body.classList.remove('side-cart-open');
    var back = document.getElementById(backdropId);
    if (back) back.classList.remove('show');
  };

  $(function () {
    var sideCartEl = getSideCartEl();
    if (sideCartEl) {
      var checkMobile = function () {
        if (window.innerWidth <= 576) {
          sideCartEl.classList.add('side-cart-mobile-bottom');
        } else {
          sideCartEl.classList.remove('side-cart-mobile-bottom');
        }
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
    }
  });

  // منع الانتقال لصفحة السلة وفتح السلة الجانبية عند النقر على أيقونة السلة
  $(document).on('click', '.a-shopping-cart', function (e) {
    var el = getSideCartEl();
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof closeSlidingMenu === 'function') closeSlidingMenu();
    if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Offcanvas) {
      var offcanvas = window.bootstrap.Offcanvas.getInstance(el);
      if (!offcanvas) offcanvas = new window.bootstrap.Offcanvas(el);
      offcanvas.show();
    } else {
      window.openSideCart();
    }
  });
})();
