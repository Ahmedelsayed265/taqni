/* eslint-disable max-lines */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
var fixed_header;
var sticky;
var cart_products = [];

/*
  Modal fallback: ensure data-toggle="modal" and data-dismiss="modal" work
  (Bootstrap 4 may not bind correctly if loaded after DOM or inside stopPropagation areas)
*/
$(function () {
  $(document).on('click', '[data-toggle="modal"]', function (e) {
    var target = $(this).attr('data-target') || $(this).data('target');
    if (!target) return;
    e.preventDefault();
    if (typeof $(target).modal === 'function') {
      $(target).modal('show');
    } else {
      $(target).addClass('show').css('display', 'block');
      $('body').addClass('modal-open');
      if (!$('#modal-backdrop').length) {
        $('body').append('<div id="modal-backdrop" class="modal-backdrop fade show"></div>');
      }
    }
  });
  $(document).on('click', '[data-dismiss="modal"]', function (e) {
    e.preventDefault();
    var $modal = $(this).closest('.modal');
    if (typeof $modal.modal === 'function') {
      $modal.modal('hide');
    } else {
      $modal.removeClass('show').css('display', '');
      $('body').removeClass('modal-open');
      $('#modal-backdrop').remove();
    }
  });
  $(document).on('click', '.modal-backdrop', function () {
    $('.modal.show').removeClass('show').css('display', '');
    $('body').removeClass('modal-open');
    $(this).remove();
  });
});

function handleLoginAction(redirectTo = '', addToUrl = true) {
  if (window.customerAuthState && window.customerAuthState.isAuthenticated) {
    return;
  }

  if (window.auth_dialog && window.auth_dialog.open && typeof window.auth_dialog.open === 'function') {
    if (redirectTo && addToUrl) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('redirect_to', redirectTo);
      window.history.replaceState({}, '', currentUrl.toString());
    }

    window.auth_dialog.open();
  } else {
    const redirectUrl = redirectTo
      ? `/auth/login?redirect_to=${encodeURIComponent(redirectTo)}`
      : '/auth/login';
    window.location.href = redirectUrl;
  }
}

function handleGiftCardClick() {
  if (!window.customerAuthState || !window.customerAuthState.isAuthenticated) {
    handleLoginAction('', false);
    return;
  }

  if (window.gift_dialog && window.gift_dialog.open && typeof window.gift_dialog.open === 'function') {
    window.gift_dialog.open();
  }
}

window.onscroll = () => fixed_header_to_top();

function menuFiixedHeader() {
  fixed_header = document.getElementById('fixed-header');
  sticky = fixed_header?.offsetTop;
}

function fixed_header_to_top() {
  const header = document.querySelector('.header-main');
  const scrollPos = window.pageYOffset;

  if (scrollPos > 10) {
    header?.classList.add('scrolled');
  } else if (scrollPos <= 5) {
    header?.classList.remove('scrolled');
  }

  if (scrollPos > sticky) {
    if (fixed_header) {
      fixed_header.classList.add('sticky');
      $('.app-content').addClass('app-content-padded');
    }
  } else {
    if (fixed_header) {
      fixed_header.classList.remove('sticky');
      $('.app-content').removeClass('app-content-padded');
    }
  }
}

function showDropItems() {
  let dropitems = document.getElementById('women-dropitmes');
  dropitems.classList.remove('dropitems');
  dropitems.classList.add('dropitems-shown');
}

function hideDropItems() {
  let dropitems = document.getElementById('women-dropitmes');
  dropitems.classList.remove('dropitems-shown');
  dropitems.classList.add('dropitems');
}

function hideDropDownMenu() {
  elem.classList.remove('dropitems-shown');
  elem.classList.add('dropitems');
}

function rowSlideRight(selector) {
  let containerFluid = document.querySelector(selector);
  let width = containerFluid.offsetWidth;
  containerFluid.scrollLeft = 0;
}

function rowSlideLeft(selector) {
  var containerFluid = document.querySelector(selector);
  var width = containerFluid.offsetWidth;
  containerFluid.scrollLeft = -width;
}

function hideAnnouncementBar() {
  $('.announcement-bar').addClass('d-none');
}

function hideAvailabilityBar() {
  $('.availability-bar').addClass('d-none');
}

/*
    Cart
*/

function hideElmById(id) {
  document.getElementById(id).style.display = 'none';
}

function showShoppingCart() {
  document.getElementById('header-shopping-cart').style.width = '40%';
  document.body.classList.add('disable-scroll');
  addCartItem();
}

function hideShoppingCart() {
  document.getElementById('header-shopping-cart').style.width = '0%';
  document.body.classList.remove('disable-scroll');
  removeCartItems();
  hideElmById('empty-cart');
}

function getCartTotal() {
  return cart_products.reduce((acc, product) => acc + product.price * product.quantity, 0);
}

function getCartItemHTML(product) {
  return `
        <div id="cart-item-${product.id}" class="cart-item d-flex flex-row">
            <div class="cart-item-img"></div>
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${product.price_string}</div>
            <div class="cart-item-quantity">${product.quantity}</div>
            <div class="cart-item-total">${product.price * product.quantity} ${localStorage.getItem('currency')}</div>
        </div>
    `;
}

function addCartItem() {
  let cart = document.getElementById('cart-items');
  cart.innerHTML = '';
  cart.style.display = 'flex';

  let empty_cart = document.getElementById('empty-cart');

  if (cart_products.length === 0) {
    empty_cart.style.display = 'flex';

    return;
  }

  cart_products.forEach(product => cart.insertAdjacentHTML('beforeend', getCartItemHTML(product)));
}

function removeCartItems() {
  let cart = document.getElementById('cart-items');
  cart.innerHTML = '';
}

function updateCartProducts(res) {
  let added_product = res.data.cart.product;
  let i = cart_products.findIndex(item => item.product_id == added_product.product_id);
  i > -1 ? (cart_products[i] = added_product) : cart_products.push(added_product);

  let quantity = cart_products.reduce((acc, product) => acc + product.quantity, 0);
  setCartCount(quantity);
}

function removeFromCartProducts(res, product_id) {
  let i = cart_products.findIndex(item => item.product_id === product_id);

  if (i > -1) {
    cart_products.splice(i, 1);
  }

  let quantity = cart_products.reduce((acc, product) => acc + product.quantity, 0);
  setCartCount(quantity);
}

function productCartAddToCart(elm, product_id) {
  var $btn = $(elm);
  var $wrap = $btn.closest('.outlit-product-card__add-cart-wrap');
  var $scope = $wrap.length ? $wrap : $btn;
  var $progress = $scope.find('.add-to-cart-progress');
  var $icon = $scope.find('.outlit-product-card__add-cart-icon, .reels-card-add-icon');
  if ($progress.length && $progress.hasClass('d-none') === false) return;

  $icon.addClass('d-none');
  $progress.removeClass('d-none');

  addToCart(product_id, 1, function (response) {
    $icon.removeClass('d-none');
    $progress.addClass('d-none');

    if ($wrap.length && response && response.data && response.data.cart) {
      var cart = response.data.cart;
      var added = (cart.product && (cart.product.product_id === product_id || cart.product.id)) ? cart.product : null;
      if (!added && cart.products && cart.products.length) {
        var pid = (product_id + '').replace(/-/g, '');
        added = cart.products.find(function (p) { return (p.product_id + '') === pid || (p.id + '') === product_id; });
      }
      if (added) {
        var cartItemId = added.id || added.cart_item_id;
        var qty = parseInt(added.quantity, 10) || 1;
        productCardShowQuantityMode($wrap[0], cartItemId, qty);
      }
    }

    if (elm) {
      var card = $btn.closest('.outlit-product-card, .product-item');
      var image = $('#product-card-img-' + product_id, card);
      var cartEl = $('.a-shopping-cart');
      if (cartEl.length && typeof addToCartAnimation === 'function') addToCartAnimation(cartEl, image);
    }
  });
}

function addToCart(product_id, quantity, onCompleted) {
  zid.cart
    .addProduct({
      product_id: product_id,
      quantity: quantity,
    }, { showErrorNotification: true })
    .then(function (response) {
      if (response) {
        var cart = (response && response.data && response.data.cart) ? response.data.cart : (response && response.data) ? response.data : response;
        setCartTotalAndBadge(cart || response);
        fetchCart();
        if (typeof window.openSideCart === 'function') {
          window.openSideCart();
        }
        if (onCompleted) {
          onCompleted(response);
        }
      }
    });
}

function productCardShowQuantityMode(wrapEl, cartItemId, quantity) {
  if (!wrapEl) return;
  var wrap = wrapEl.nodeName ? wrapEl : document.querySelector(wrapEl);
  if (!wrap) return;
  wrap.setAttribute('data-cart-item-id', cartItemId);
  var btn = wrap.querySelector('.outlit-product-card__add-cart-btn');
  var qtyWrap = wrap.querySelector('.outlit-product-card__quantity-wrap');
  var qtyNum = wrap.querySelector('.outlit-product-card__qty-num[data-qty]');
  if (btn) btn.classList.add('d-none');
  if (qtyWrap) qtyWrap.classList.remove('d-none');
  if (qtyNum) qtyNum.textContent = quantity;
}

function productCardShowAddMode(wrapEl) {
  if (!wrapEl) return;
  var wrap = wrapEl.nodeName ? wrapEl : document.querySelector(wrapEl);
  if (!wrap) return;
  wrap.removeAttribute('data-cart-item-id');
  var btn = wrap.querySelector('.outlit-product-card__add-cart-btn');
  var qtyWrap = wrap.querySelector('.outlit-product-card__quantity-wrap');
  if (btn) btn.classList.remove('d-none');
  if (qtyWrap) qtyWrap.classList.add('d-none');
}

function productCardRemoveFromCart(btn) {
  var wrap = (btn && btn.closest) ? btn.closest('.outlit-product-card__add-cart-wrap') : null;
  if (!wrap) return;
  var cartItemId = wrap.getAttribute('data-cart-item-id');
  if (!cartItemId || !window.zid || !window.zid.cart || !window.zid.cart.removeProduct) return;
  if (typeof event !== 'undefined') { event.preventDefault(); event.stopPropagation(); }
  window.zid.cart.removeProduct({ product_id: cartItemId }, { showErrorNotification: true })
    .then(function () {
      if (typeof fetchCart === 'function') fetchCart();
      productCardShowAddMode(wrap);
    });
}

function productCardUpdateQuantity(wrapEl, newQty) {
  var wrap = wrapEl && wrapEl.nodeName ? wrapEl : null;
  if (!wrap) return;
  var cartItemId = wrap.getAttribute('data-cart-item-id');
  if (!cartItemId || !window.zid || !window.zid.cart || !window.zid.cart.updateProduct) return;
  var q = parseInt(newQty, 10);
  if (isNaN(q) || q < 1) return;
  window.zid.cart.updateProduct({ product_id: cartItemId, quantity: q }, { showErrorNotification: true })
    .then(function () {
      if (typeof fetchCart === 'function') fetchCart();
      var qtyNum = wrap.querySelector('.outlit-product-card__qty-num[data-qty]');
      if (qtyNum) qtyNum.textContent = q;
    });
}

function updateProductCardsFromCart(cart) {
  if (!cart) return;
  var products = cart.products || cart.items || cart.cart_products || [];
  if (!Array.isArray(products)) products = [];
  document.querySelectorAll('.outlit-product-card__add-cart-wrap[data-product-id]').forEach(function (wrap) {
    var productId = (wrap.getAttribute('data-product-id') || '').replace(/-/g, '');
    var item = products.find(function (p) { return (p.product_id + '') === productId; });
    if (item) {
      productCardShowQuantityMode(wrap, item.id || item.cart_item_id, parseInt(item.quantity, 10) || 1);
    } else {
      productCardShowAddMode(wrap);
    }
  });
}

$(document).on('click', '.outlit-product-card__qty-plus', function (e) {
  e.preventDefault();
  e.stopPropagation();
  var wrap = this.closest('.outlit-product-card__add-cart-wrap');
  if (!wrap) return;
  var qtyEl = wrap.querySelector('.outlit-product-card__qty-num[data-qty]');
  var qty = parseInt(qtyEl ? qtyEl.textContent : 0, 10) || 1;
  qty = Math.min(999, qty + 1);
  productCardUpdateQuantity(wrap, qty);
});
$(document).on('click', '.outlit-product-card__qty-minus', function (e) {
  e.preventDefault();
  e.stopPropagation();
  var wrap = this.closest('.outlit-product-card__add-cart-wrap');
  if (!wrap) return;
  var qtyEl = wrap.querySelector('.outlit-product-card__qty-num[data-qty]');
  var qty = parseInt(qtyEl ? qtyEl.textContent : 0, 10) || 1;
  qty = Math.max(1, qty - 1);
  productCardUpdateQuantity(wrap, qty);
});

function removeFromCart(product_id) {
  product_id_str = product_id.replaceAll('-', '');
  let i = cart_products.findIndex(item => item.product_id == product_id_str);

  zid.cart
    .removeProduct({ product_id: cart_products[i].id }, {showErrorNotification: true})
    .then(res => removeFromCartProducts(res, product_id_str));
}

function fillWishlistItems(items) {
  items.forEach(product => {
    const containerFluid = $(`.add-to-wishlist[data-wishlist-id=${product.id}]`)[0];
    if (!containerFluid) return;

    // Find the filled button (with zid-visible-wishlist attribute)
    const filledButton = containerFluid.querySelector(`[zid-visible-wishlist="${product.id}"]`);
    // Find the empty button (with zid-hidden-wishlist attribute or without filled class)
    const emptyButton = containerFluid.querySelector(`[zid-hidden-wishlist="${product.id}"]`) ||
                        containerFluid.querySelector('.icon-heart-mask:not(.filled)');

    // Show filled button, hide empty button
    if (filledButton) {
      filledButton.style.setProperty('display', 'inline-block', 'important');
      filledButton.classList.add('filled');
    }
    if (emptyButton) {
      emptyButton.style.setProperty('display', 'none', 'important');
    }
  });
}

function addToWishlist(elm, productId) {
  const containerFluid = $(elm).closest('.add-to-wishlist');

  // Hide ALL heart buttons and show loader
  containerFluid.find('.icon-heart-mask').each(function() {
    this.style.setProperty('display', 'none', 'important');
  });
  containerFluid.find('.loader').removeClass('d-none');

  // Remove From Wishlist if added
  if ($(elm).hasClass('filled')) {
    return removeFromWishlist(elm, productId);
  }

  zid.account.addToWishlists({ product_ids: [productId] }, { showErrorNotification: true }).then(response => {
    if (response) {
      containerFluid.find('.loader').addClass('d-none');

      // Hide the empty button, show the filled button
      const filledButton = containerFluid.find(`[zid-visible-wishlist="${productId}"]`)[0];
      const emptyButton = containerFluid.find(`[zid-hidden-wishlist="${productId}"]`)[0] ||
                          containerFluid.find('.icon-heart-mask:not([zid-visible-wishlist])')[0];

      if (filledButton) {
        filledButton.style.setProperty('display', 'inline-block', 'important');
        filledButton.classList.add('filled');
      } else {
        elm.style.setProperty('display', 'inline-block', 'important');
        $(elm).addClass('filled');
      }

      if (emptyButton) {
        emptyButton.style.setProperty('display', 'none', 'important');
      }

      // toastr.success(response.data.message);
    } else {
      // toastr.error(response.data.message);
      // Show the original button back on error
      elm.style.setProperty('display', 'inline-block', 'important');
      containerFluid.find('.loader').addClass('d-none');
    }
  });
}

function removeFromWishlist(elm, productId) {
  const containerFluid = $(elm).closest('.add-to-wishlist');

  // Hide ALL heart buttons and show loader
  containerFluid.find('.icon-heart-mask').each(function() {
    this.style.setProperty('display', 'none', 'important');
  });
  containerFluid.find('.loader').removeClass('d-none');

  zid.account.removeFromWishlist(productId, { showErrorNotification: true }).then(response => {
    containerFluid.find('.loader').addClass('d-none');

    if (location.pathname === '/account-wishlist') {
      location.reload();
      return;
    }

    // Hide the filled button, show the empty button
    const filledButton = containerFluid.find(`[zid-visible-wishlist="${productId}"]`)[0];
    const emptyButton = containerFluid.find(`[zid-hidden-wishlist="${productId}"]`)[0] ||
                        containerFluid.find('.icon-heart-mask:not([zid-visible-wishlist])')[0];

    if (emptyButton) {
      emptyButton.style.setProperty('display', 'inline-block', 'important');
      emptyButton.classList.remove('filled');
    } else {
      elm.style.setProperty('display', 'inline-block', 'important');
      $(elm).removeClass('filled');
    }

    if (filledButton) {
      filledButton.style.setProperty('display', 'none', 'important');
      filledButton.classList.remove('filled');
    }
  }).catch(error => {
    console.error('Failed to remove from wishlist:', error);
    // Show the original button back on error
    elm.style.setProperty('display', 'inline-block', 'important');
    containerFluid.find('.loader').addClass('d-none');
  });
}

function shareWishlist() {
  $('.share-wishlist .loader').removeClass('d-none').siblings('.share-icon').addClass('d-none');

  zid.account.shareWishlist({ showErrorNotification: true }).then(async response => {
    if (response) {
      $('.share-wishlist .loader').addClass('d-none').siblings('.share-icon').removeClass('d-none');

      if (response.data.link) {
        try {
          await navigator.clipboard.writeText(response.data.link);
          window.zid?.toaster?.showSuccess(response.data.message);
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      window.zid?.toaster?.showError(response.data.message);
    }
  });
}

/*
    Initialize Cart
*/

/*
    mega-menu (do not block modal triggers inside dropdown)
*/
jQuery(document).on('click', '.mega-dropdown', function (e) {
  if ($(e.target).closest('[data-toggle="modal"]').length) return;
  e.stopPropagation();
});

/*
 slider-filter (jQuery UI) - ربط سلايدر السعر بحقلي من/إلى في فلتر المنتجات
 */
$(function () {
  var $sliderRange = $('#slider-range');
  var $priceMin = $('#price_min');
  var $priceMax = $('#price_max');
  if (!$sliderRange.length || !$priceMin.length || !$priceMax.length || typeof $sliderRange.slider !== 'function') return;

  var minVal = parseInt($sliderRange.data('slider-min'), 10) || 0;
  var maxVal = parseInt($sliderRange.data('slider-max'), 10) || 100000;
  var fromInput = parseInt($priceMin.val(), 10);
  var toInput = parseInt($priceMax.val(), 10);
  var initialMin = (isNaN(fromInput) ? minVal : Math.max(minVal, Math.min(fromInput, maxVal)));
  var initialMax = (isNaN(toInput) ? maxVal : Math.max(initialMin, Math.min(toInput, maxVal)));

  $sliderRange.slider({
    range: true,
    min: minVal,
    max: maxVal,
    values: [initialMin, initialMax],
    slide: function (event, ui) {
      $priceMin.val(ui.values[0]);
      $priceMax.val(ui.values[1]);
    },
  });

  $priceMin.val($sliderRange.slider('values', 0));
  $priceMax.val($sliderRange.slider('values', 1));

  $priceMin.on('change', function () {
    var v = parseInt($(this).val(), 10);
    if (!isNaN(v)) {
      var vals = $sliderRange.slider('values');
      $sliderRange.slider('values', 0, Math.min(v, vals[1]));
      $priceMin.val($sliderRange.slider('values', 0));
    }
  });
  $priceMax.on('change', function () {
    var v = parseInt($(this).val(), 10);
    if (!isNaN(v)) {
      var vals = $sliderRange.slider('values');
      $sliderRange.slider('values', 1, Math.max(v, vals[0]));
      $priceMax.val($sliderRange.slider('values', 1));
    }
  });
});

/*
 product-comment-twig show more show less
 */
$('#show-more-content').hide();

$('#show-more').click(function () {
  $('#show-more-content').show(500);
  $('#show-less').show();
  $('#show-more').hide();
});

$('#show-less').click(function () {
  $('#show-more-content').hide(500);
  $('#show-more').show();
  $(this).hide();
});

function displayActivePaymentSessionBar(cart) {
  if (cart.is_reserved) {
    $('.payment-session-bar').removeClass('d-none');
  }
}

function fetchCart() {
  var sideCart = document.getElementById('side-cart-modern');
  var loading = sideCart && sideCart.querySelector('.loading-cart');
  if (loading) loading.classList.remove('d-none');

  zid.cart.get({ showErrorNotification: true }).then(function (response) {
    var cart = (response && response.data && response.data.cart) ? response.data.cart : (response && response.data) ? response.data : response;
    if (!cart) cart = { products_count: 0, cart_items_quantity: 0, totals: [], products: [] };
    setCartTotalAndBadge(cart);
    displayActivePaymentSessionBar(cart);
    if (sideCart && typeof window.renderSideCart === 'function') window.renderSideCart(cart);
    if (typeof updateProductCardsFromCart === 'function') updateProductCardsFromCart(cart);
  }).finally(function () {
    if (loading) loading.classList.add('d-none');
  });
}

function getCartTotal(cart) {
  if (cart && cart.totals && cart.totals.length > 0) {
    var cartTotalItem = cart.totals.filter(function (total) {
      return total.code === 'total';
    });

    if (cartTotalItem.length > 0) {
      return cartTotalItem[0].value_string;
    }
  }

  return null;
}

function setCartTotalAndBadge(cart) {
  setCartBadge(cart.cart_items_quantity ?? cart.products_count);
  var cartTotal = getCartTotal(cart);

  if (cartTotal) {
    setCartIconTotal(cartTotal);
  }
}

function setCartIconTotal(total) {
  $('.cart-header-total').html(total);
}

function setCartBadge(badge) {
  if (badge > 0) {
    $('.cart-badge').removeClass('d-none');
    $('.cart-badge').html(badge);
    showGiftCart();
  } else {
    $('.cart-badge').addClass('d-none');
  }
}

function showGiftCart() {
  if (location.pathname !== '/cart/view') {
    $('#tooltip').removeClass('d-none');
    setTimeout(() => {
      $('#tooltip').addClass('d-none');
    }, 3000);
  }
}

function closeSlidingMenu() {
  if (window.slidingMenu && typeof window.slidingMenu.close === 'function') {
    window.slidingMenu.close();
  }
}

function clearFilters() {
  $('.form-products-filter input').val('');
  const cleanURL = window.location.origin + window.location.pathname;
  window.location.href = cleanURL;
}

var SEARCH_RECENT_KEY = 'zid_search_recent';
var SEARCH_RECENT_MAX = 10;

function getRecentSearches() {
  try {
    var raw = localStorage.getItem(SEARCH_RECENT_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, SEARCH_RECENT_MAX) : [];
  } catch (e) {
    return [];
  }
}

function saveRecentSearch(term) {
  term = String(term || '').trim();
  if (!term) return;
  var arr = getRecentSearches();
  arr = arr.filter(function (t) { return t !== term; });
  arr.unshift(term);
  arr = arr.slice(0, SEARCH_RECENT_MAX);
  try {
    localStorage.setItem(SEARCH_RECENT_KEY, JSON.stringify(arr));
  } catch (e) {}
}

function getTrendingSuggestions() {
  var recent = getRecentSearches();
  if (recent && recent.length > 0) return recent;
  var def = window.__search_trending_default;
  return Array.isArray(def) ? def : [];
}

function renderSearchSuggestions() {
  var $title = $('#search-modal-trending-title');
  var $list = $('#search-modal-suggestions');
  if (!$list.length) return;
  var label = (typeof window.__search_trending_label === 'string') ? window.__search_trending_label : 'عمليات البحث الرائجة';
  var noSuggestions = (typeof window.__search_no_suggestions === 'string') ? window.__search_no_suggestions : 'لا توجد عمليات بحث حديثة';
  if ($title.length) $title.text(label).show();
  var list = getTrendingSuggestions();
  $list.empty();
  if (!list || list.length === 0) {
    $list.append('<li class="search-modal-suggestion-item search-modal-suggestion-item--empty">' + noSuggestions + '</li>');
    return;
  }
  list.forEach(function (term) {
    var enc = encodeURIComponent(term);
    var $li = $('<li class="search-modal-suggestion-item"><a href="/products?q=' + enc + '" class="search-modal-suggestion-link" data-search-term="' + term.replace(/"/g, '&quot;') + '">' + term.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</a></li>');
    $li.find('a').on('click', function (e) {
      saveRecentSearch(term);
      $('#search-modal-input').val(term);
    });
    $list.append($li);
  });
}

function toggleTrendingVisibility(show) {
  var $tr = $('#search-modal-trending');
  if ($tr.length) $tr.toggleClass('is-hidden', !show);
}

function openSearchOverlay() {
  $('#search-modal-overlay').addClass('is-open').attr('aria-hidden', 'false');
  $('#search-modal-input').val('').focus();
  $('body').addClass('search-modal-open');
  $('#search-modal-autocomplete').removeClass('has-results').html('');
  renderSearchSuggestions();
  toggleTrendingVisibility(true);
}

function closeSearchOverlay() {
  $('#search-modal-overlay').removeClass('is-open').attr('aria-hidden', 'true');
  $('body').removeClass('search-modal-open');
  $('#search-modal-autocomplete').removeClass('has-results').html('');
  toggleTrendingVisibility(true);
}

$(document).on('click', '.sm-search-icon', function () {
  openSearchOverlay();
});

$('#filters-form-collapse-sm').on('hidden.bs.collapse', function () {
  $('.filters_expanded').removeClass('d-none');
  $('.filters_not_expanded').addClass('d-none');
});

$('#filters-form-collapse-sm').on('shown.bs.collapse', function () {
  $('.filters_expanded').addClass('d-none');
  $('.filters_not_expanded').removeClass('d-none');
});

// Mobile filters toggle:
// - On mobile (<= 768px): open/close product-attributes overlay with attribute filters
// - On larger screens: fallback to collapsing the small filters form (#filters-form-collapse-sm)
function toggleProductAttributeMobile() {
  var $win = $(window);
  var isMobile = $win.width() <= 768;

  if (isMobile) {
    var $attr = $('.product-attributes.rtl, .product-attributes').first();
    var $box = $attr.find('.products-filters-container').first();
    // لو مفيش فلاتر خصائص، نرجع نستخدم الكولابس الصغير بدل ما الزر ما يشتغلش
    if (!$attr.length || !$box.length) {
      var $targetFallback = $('#filters-form-collapse-sm');
      if (!$targetFallback.length) return;

      var isOpenFallback = $targetFallback.hasClass('show') || $targetFallback.is(':visible');

      if (isOpenFallback) {
        $targetFallback.removeClass('show').addClass('collapse');
        $targetFallback.attr('aria-expanded', 'false');
      } else {
        $targetFallback.addClass('show').removeClass('collapse');
        $targetFallback.attr('aria-expanded', 'true');
      }
      return;
    }

    var isOpen = $attr.hasClass('product-attributes-show-mobile') ||
                 $box.hasClass('products-filters-container-show-mobile');

    if (isOpen) {
      $attr.removeClass('product-attributes-show-mobile');
      $box.removeClass('products-filters-container-show-mobile');
      $('body').removeClass('product-attributes-open');
    } else {
      $attr.addClass('product-attributes-show-mobile');
      $box.addClass('products-filters-container-show-mobile');
      $('body').addClass('product-attributes-open');
    }
  } else {
    // Desktop / tablet: toggle the small filters collapse block
    var $target = $('#filters-form-collapse-sm');
    if (!$target.length) return;

    var isOpenDesktop = $target.hasClass('show') || $target.is(':visible');

    if (isOpenDesktop) {
      $target.removeClass('show').addClass('collapse');
      $target.attr('aria-expanded', 'false');
    } else {
      $target.addClass('show').removeClass('collapse');
      $target.attr('aria-expanded', 'true');
    }
  }
}

$(document).on('click', '#products-list-filter-collapse', function (e) {
  e.preventDefault();
  toggleProductAttributeMobile();
});

// Custom dropdown logic for products sort (avoid Bootstrap conflicts)
$(document).on('click', '#products-list-sort', function (e) {
  e.preventDefault();
  e.stopPropagation();

  var $btn = $(this);
  var $menu = $btn.closest('.dropdown').find('.select-dropdown');

  // Close any other open sort dropdowns
  $('.select-dropdown.show').not($menu).removeClass('show');
  $('[aria-expanded="true"]').not($btn).attr('aria-expanded', 'false');

  var isOpen = $menu.hasClass('show');
  $menu.toggleClass('show', !isOpen);
  $btn.attr('aria-expanded', isOpen ? 'false' : 'true');
});

// Close sort dropdown when clicking outside
$(document).on('click', function () {
  $('.select-dropdown.show').removeClass('show');
  $('#products-list-sort[aria-expanded="true"]').attr('aria-expanded', 'false');
});

function getMenuPrev(elm) {
  if (!elm) return null;

  var EPrev = $(elm).prev();

  if (EPrev) {
    if (EPrev.hasClass('d-none')) {
      return getMenuPrev(EPrev);
    } else {
      return EPrev;
    }
  }

  return null;
}

function fixMenu(prevLiElm) {
  var $mainNav = $('.main-nav');
  var listItems = $mainNav.find('> li');

  /* قائمة التصنيفات الرئيسية: نعرض كل التصنيفات بدون حد، والتمرير أفقي (overflow-x: auto) */
  if ($mainNav.hasClass('header-categories-list')) {
    listItems.removeClass('d-none');
    return;
  }

  listItems.each(function (idx, li) {
    if (idx > 3) {
      if (!$(li).hasClass('all-categories') && !$(li).hasClass('d-none')) {
        if ($(li).offset().top - $(li).parent().offset().top > 4) {
          $(li).addClass('d-none');
        } else {
          $(li).removeClass('d-none');
        }
      }
    }
  });

  var elmAllCat = $('.main-nav > li.all-categories');

  if ($(elmAllCat).length) {
    if ($(elmAllCat).offset().top - $(elmAllCat).parent().offset().top > 4) {
      var pElm = null;

      if (prevLiElm) {
        pElm = getMenuPrev(prevLiElm);
      } else {
        pElm = getMenuPrev(elmAllCat);
      }

      $(pElm).addClass('d-none');
      fixMenu(pElm);
    }
  }

  if ($('.main-nav').parent().outerWidth() - $('.main-nav').outerWidth() < 100) {
    $('.main-nav').addClass('justify-content-between');
  } else {
    $('.main-nav').removeClass('justify-content-between');
  }

  if ($('.main-nav-wrapper').length) {
    $('.main-nav-wrapper').removeClass('main-nav-wrapper');
  }
}

$(window).resize(function () {
  fixMenu();
});

$('.search-input-input').on('keyup', function (e) {
  if (e.key === 'Enter' || e.keyCode === 13) {
    window.location.href = '/products?q=' + encodeURI(this.value);
  }
});

//$( document ).ready(function() {
document.addEventListener('DOMContentLoaded', function () {
  fetchCart();
  productsQuestions.checkAddQuestionPossibility();

  /* mobile slide menu */
  window.slidingMenuElement = document.getElementById('sliding-menu');
  window.slidingMenu = new SlideMenu(window.slidingMenuElement, {
    position: window.appDirection === 'ltr' ? 'left' : 'right',
    showBackLink: true,
    backLinkBefore:
      window.appDirection === 'ltr'
        ? '<span class="icon-arrow_left slide-menu-arrow slide-menu-arrow-back"></span>'
        : '<span class="icon-arrow_right slide-menu-arrow slide-menu-arrow-back"></span>',
    submenuLinkAfter:
      window.appDirection === 'ltr'
        ? '<span class="icon-arrow_right slide-menu-arrow"></span>'
        : '<span class="icon-arrow_left slide-menu-arrow"></span>',
  });

  window.slidingMenuElement.addEventListener('sm.open', function () {
    $('body').addClass('sidenav-open');
  });

  window.slidingMenuElement.addEventListener('sm.close', function () {
    $('body').removeClass('sidenav-open');
  });

  /* تفويض الأحداث لضمان عمل البحث في المودال */
  $(document).on('input', '.search-input-input', function (event) {
    var target = event.currentTarget;
    if ($('#search-modal-overlay').hasClass('is-open')) {
      fetchProductsSearchDebounce($('#search-modal-input')[0], '#search-modal-autocomplete');
    } else {
      fetchProductsSearchDebounce(target, '.autocomplete-items');
    }
  });

  /* Search modal: open on focus/click of header or mobile search input */
  $(document).on('focus click', '.search-input-input:not(#search-modal-input)', function () {
    var val = $(this).val();
    openSearchOverlay();
    if (val) $('#search-modal-input').val(val);
  });
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' && $('#search-modal-overlay').hasClass('is-open')) {
      closeSearchOverlay();
    }
  });
  $(document).on('click', '[data-close-search-modal]', function () {
    closeSearchOverlay();
  });
  $('#search-modal-input').on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      var term = $(this).val();
      if (term && String(term).trim()) saveRecentSearch(term);
      window.location.href = '/products?q=' + encodeURIComponent(term || '');
    }
  });

  /* mobile slide menu */
  fixMenu();

  menuFiixedHeader();
  fixed_header_to_top();
});

var fetchProductsSearchDebounce = debounce(function (target, resultSelector) {
  resultSelector = resultSelector || '.autocomplete-items';
  fetchProductsSearch($(target).attr('data-cat-id'), $(target).val(), resultSelector);
}, 650);

function fetchProductsSearch(catId, query, resultSelector) {
  resultSelector = resultSelector || '.autocomplete-items';
  var $container = $(resultSelector);
  if (!$container.length) return;
  var queryStr = query ? String(query).trim() : '';
  if (queryStr.length <= 0) {
    $container.removeClass('has-results').html('');
    if (resultSelector === '#search-modal-autocomplete') { toggleTrendingVisibility(true); renderSearchSuggestions(); }
    return;
  }

  var opts = {
    page_size: 5,
    q: queryStr,
    categories: (catId && String(catId).trim()) ? catId : undefined
  };

  (typeof zid !== 'undefined' && zid.products && typeof zid.products.list === 'function'
    ? zid.products.list(opts, { showErrorNotification: false })
    : Promise.reject(new Error('API not available'))
  )
    .then(function (response) {
      $container.removeClass('has-results').html('');
      var list = (response && response.results)
        ? response.results
        : (response && response.data && (response.data.results || response.data))
          ? (response.data.results || response.data)
          : Array.isArray(response) ? response : [];
      if (list && list.length > 0) {
        list = list.slice(0, 5);
        for (var i = 0; i < list.length; i++) {
          var p = list[i];
          var url = (p && (p.html_url || p.url)) || (p && p.slug ? '/products/' + String(p.slug).replace(/"/g, '&quot;') : '#');
          var name = (p && (p.name || p.title)) || '';
          var nameEsc = String(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          $container.append('<div role="option"><a href="' + url + '">' + nameEsc + '</a></div>');
        }
        $container.addClass('has-results');
        if (resultSelector === '#search-modal-autocomplete') toggleTrendingVisibility(false);
      } else {
        if (resultSelector === '#search-modal-autocomplete') { toggleTrendingVisibility(true); renderSearchSuggestions(); }
      }
    })
    .catch(function () {
      $container.removeClass('has-results').html('');
      if (resultSelector === '#search-modal-autocomplete') { toggleTrendingVisibility(true); renderSearchSuggestions(); }
    });
}

function closeSearchModal() {
  closeSearchOverlay();
}

function debounce(func, wait, immediate) {
  var timeout;

  return function () {
    var context = this,
      args = arguments;

    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function sessionLangCurrencyChange() {
  var currency = $('.select-country option:selected').attr('data-currency');
  var currencySymbol = $('.select-country option:selected').attr('data-currency-symbol');

  $('#input-change-session-currency').val(currency);
  $('#input-change-session-currency-symbol').val(currencySymbol);
}

function addToCartAnimation(cart, imgtodrag) {
  if (!imgtodrag || !imgtodrag.length || !cart || !cart.length) return;
  var cartVisible = cart.filter(':visible').first();
  if (!cartVisible.length) cartVisible = cart.first();
  var imgEl = imgtodrag[0];
  var cartEl = cartVisible[0];
  if (!imgEl || !cartEl) return;
  var imgRect = imgEl.getBoundingClientRect();
  var cartRect = cartEl.getBoundingClientRect();

  var imgclone = imgtodrag
    .clone()
    .css({
      opacity: '0.7',
      position: 'fixed',
      top: imgRect.top,
      left: imgRect.left,
      height: imgRect.height || 150,
      width: imgRect.width || 150,
      margin: 0,
      'z-index': 9999,
      pointerEvents: 'none',
    })
    .appendTo($('body'));

  var easing = typeof $.easing.easeInOutExpo === 'function' ? 'easeInOutExpo' : 'swing';

  imgclone.animate(
    {
      top: cartRect.top + 10,
      left: cartRect.left + 10,
      width: 75,
      height: 75,
    },
    1000,
    easing,
    function () {
      $(this).animate(
        { width: 0, height: 0, opacity: 0 },
        200,
        function () {
          $(this).detach();
        }
      );
    }
  );
}

function goBack() {
  if (document.referrer && document.referrer.split('/')[2] === window.location.host) {
    history.go(-1);

    return false;
  } else {
    window.location.href = '/';
  }
}

function scrollToSubMenu(ele) {
  const subMenuElement = ele.querySelector('ul');

  if (subMenuElement) {
    const subMenu = document.getElementById('sliding-menu');
    subMenu.scrollTop = 0;
  }
}

class ProductsQuestions {
  constructor() {
    this.emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    this.customer = window.customer;
    this.customerName = $('#addProductQuestionModal input[name="name"]');
    this.customerEmail = $('#addProductQuestionModal input[name="email"]');
    this.customerQuestion = $('#addProductQuestionModal textarea[name="question"]');
    this.isAnonymous = $('#addProductQuestionModal input[name="is_anonymous"]');
    this.submitButton = $('.btn-submit-new-question');
  }

  isValidEmail() {
    return this.emailRegex.test(this.customerEmail.val());
  }

  showError(inputName) {
    $(`#addProductQuestionModal .input-error-${inputName}`).removeClass('d-none');
    $(
      `#addProductQuestionModal input[name="${inputName}"], textarea[name="${inputName}"]`
    ).addClass('border-danger');
  }

  hideError(inputName) {
    $(`#addProductQuestionModal .input-error-${inputName}`).addClass('d-none');
    $(
      `#addProductQuestionModal input[name="${inputName}"], textarea[name="${inputName}"]`
    ).removeClass('border-danger');
  }

  validateInputs() {
    let isValid = true;

    if (!this.customerQuestion.val().length) {
      this.showError('question');
      isValid = false;
    } else {
      this.hideError('question');
    }

    if (!this.customerEmail.val().length) {
      this.showError('email');
      isValid = false;
    } else {
      this.hideError('email');
    }

    if (this.customerEmail.val().length && !this.isValidEmail()) {
      $('#addProductQuestionModal .input-error-invalid-email').removeClass('d-none');
      $('#addProductQuestionModal input[name="email"]').addClass('border-danger');
      isValid = false;
    } else {
      $('#addProductQuestionModal .input-error-invalid-email').addClass('d-none');
    }

    if (!this.customerName.val().length) {
      this.showError('name');
      isValid = false;
    } else {
      this.hideError('name');
    }

    return isValid;
  }

  fillCustomerData() {
    if (this.customer && this.customer.name && this.customer.email) {
      if (!this.customerName.val()) this.customerName.val(this.customer.name);
      if (!this.customerEmail.val()) this.customerEmail.val(this.customer.email);
    }
  }

  checkAddQuestionPossibility() {
    $('#addQuestionButton').click(function () {
      if (window.customerAuthState && window.customerAuthState.isAuthenticated) {
        var $qModal = $('#addProductQuestionModal');
        if (typeof $qModal.modal === 'function') {
          $qModal.modal('show');
        } else {
          $qModal.addClass('show').css('display', 'block');
          $('body').addClass('modal-open');
          if (!$('#modal-backdrop').length) {
            $('body').append('<div id="modal-backdrop" class="modal-backdrop fade show"></div>');
          }
        }
        productsQuestions.fillCustomerData();
      } else {
        // Open login popup without adding redirect_to URL (stays on same page)
        // After login, user can click the button again to open the modal
        handleLoginAction('', false);

        return;
      }
    });
  }

  async submitQuestion(productId) {
    const isValid = this.validateInputs();

    if (isValid) {
      $('.add-review-progress').removeClass('d-none');
      this.submitButton.attr('disabled', true);

      try {
        const response = await zid.products.createQuestion(productId, {
          question: this.customerQuestion.val(),
          name: this.customerName.val(),
          email: this.customerEmail.val(),
          is_anonymous: this.isAnonymous.is(':checked'),
        }, { showErrorNotification: true });

        if (response) {
          window.zid?.toaster?.showSuccess(locales_messages.success);

          $('textarea[name="question"]').val('');
        }
      } catch (error) {
        console.log(error);
      } finally {
        $('.add-review-progress').addClass('d-none');

        var $qModal = $('#addProductQuestionModal');
        if (typeof $qModal.modal === 'function') {
          $qModal.modal('hide');
        } else {
          $qModal.removeClass('show').css('display', '');
          $('body').removeClass('modal-open');
          $('#modal-backdrop').remove();
        }
        this.submitButton.removeAttr('disabled');
      }
    }
  }
}

const productsQuestions = new ProductsQuestions();



function updateUIAfterLogin(customer) {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect_to');

  if (redirectTo) {
    window.isRedirecting = true;
    window.location.href = redirectTo;
    return;
  }

  if (window.loginFromLoyalty) {
    location.reload();
    return;
  }

  const loyaltySection = document.querySelector('.loyalty-points-section');
  if (loyaltySection && !loyaltySection.classList.contains('loyalty-points-section-d-none')) {
    location.reload();
    return;
  }

  if (window.customerAuthState) {
    window.customerAuthState.isAuthenticated = true;
    window.customerAuthState.isGuest = false;
  }

  window.customer = customer;

  document.dispatchEvent(new CustomEvent('zid-customer-fetched', {
    detail: { customer: customer }
  }));

  const loginBtn = document.getElementById('login-btn');
  const helloBtn = document.getElementById('hello-btn');
  const customerGreeting = document.getElementById('customer-greeting');

  if (loginBtn && helloBtn && customer && customer.name) {
    const greetingText = customerGreeting.textContent.trim();
    const helloWord = greetingText.split(' ')[0];
    customerGreeting.textContent = `${helloWord} ${customer.name}`;
    helloBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
  }

  const loginBtnAlt = document.getElementById('login-btn-alt');
  const helloBtnAlt = document.getElementById('hello-btn-alt');
  const customerGreetingAlt = document.getElementById('customer-greeting-alt');

  if (loginBtnAlt && helloBtnAlt && customer && customer.name) {
    const greetingTextAlt = customerGreetingAlt.textContent.trim();
    const helloWordAlt = greetingTextAlt.split(' ')[0];
    customerGreetingAlt.textContent = `${helloWordAlt} ${customer.name}`;
    helloBtnAlt.style.display = 'inline-block';
    loginBtnAlt.style.display = 'none';
  }

  document.querySelectorAll('[zid-visible-guest="true"]').forEach(el => {
    el.style.setProperty('display', 'none', 'important');
  });

  document.querySelectorAll('.add-to-wishlist > a.icon-heart-mask').forEach(el => {
    el.style.setProperty('display', 'none', 'important');
  });

  document.querySelectorAll('.add-to-wishlist').forEach(containerFluid => {
    const customerSpan = containerFluid.querySelector('span:not([zid-visible-guest])');
    if (customerSpan) {
      customerSpan.style.setProperty('display', 'inline-block', 'important');
    }
  });

  document.querySelectorAll('[zid-visible-customer="true"]').forEach(el => {
    el.style.setProperty('display', 'inline-block', 'important');
  });

  const addReviewLink = document.getElementById('add-review-link');
  const addReviewBtn = document.getElementById('add-review-btn');

  if (addReviewLink && addReviewBtn) {
    addReviewLink.classList.add('d-none');
    addReviewBtn.style.display = 'block';
  }

  if (typeof fetchCart === 'function') {
    fetchCart();
  }

  // Fetch wishlist and update button states
  if (window.zid?.account?.wishlists) {
    window.zid.account.wishlists().then(wishlistResponse => {
      let wishlistProductIds = [];

      if (wishlistResponse && wishlistResponse.results && Array.isArray(wishlistResponse.results)) {
        wishlistProductIds = wishlistResponse.results.map(item => item.id);
      } else if (Array.isArray(wishlistResponse)) {
        wishlistProductIds = wishlistResponse;
      }

      if (wishlistProductIds.length > 0) {
        fillWishlistItems(wishlistProductIds.map(id => ({ id: id })));
      }

      document.querySelectorAll('.add-to-wishlist').forEach(containerFluid => {
        const productId = containerFluid.getAttribute('data-wishlist-id');
        if (!productId) return;

        const isInWishlist = wishlistProductIds.includes(productId);
        const filledButton = containerFluid.querySelector(`[zid-visible-wishlist="${productId}"]`);
        const emptyButton = containerFluid.querySelector(`[zid-hidden-wishlist="${productId}"]`) ||
                            containerFluid.querySelector('.icon-heart-mask:not([zid-visible-wishlist])');

        if (isInWishlist) {
          if (filledButton) {
            filledButton.style.setProperty('display', 'inline-block', 'important');
            filledButton.classList.add('filled');
          }
          if (emptyButton) {
            emptyButton.style.setProperty('display', 'none', 'important');
          }
        } else {
          if (filledButton) {
            filledButton.style.setProperty('display', 'none', 'important');
            filledButton.classList.remove('filled');
          }
          if (emptyButton) {
            emptyButton.style.setProperty('display', 'inline-block', 'important');
            emptyButton.classList.remove('filled');
          }
        }
      });
    }).catch(error => {
      console.error('Failed to fetch wishlist:', error);
    });
  }

  // Retry loop to ensure wishlist visibility (handles race conditions with Zid scripts)
  let retryCount = 0;
  const maxRetries = 10;
  const forceWishlistVisibility = () => {
    document.querySelectorAll('[zid-visible-guest="true"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('.add-to-wishlist > a.icon-heart-mask').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('.add-to-wishlist').forEach(containerFluid => {
      const customerSpan = containerFluid.querySelector('span:not([zid-visible-guest])');
      if (customerSpan) {
        customerSpan.style.setProperty('display', 'inline-block', 'important');
      }
    });

    document.querySelectorAll('[zid-visible-customer="true"]').forEach(el => {
      el.style.setProperty('display', 'inline-block', 'important');
    });
  };

  forceWishlistVisibility();

  const retryInterval = setInterval(() => {
    retryCount++;
    forceWishlistVisibility();

    if (retryCount >= maxRetries) {
      clearInterval(retryInterval);
    }
  }, 100);

  setTimeout(() => {
    const guestElements = document.querySelectorAll('[zid-visible-guest="true"]');
    guestElements.forEach(el => {
      if (window.getComputedStyle(el).display !== 'none') {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('.add-to-wishlist > a.icon-heart-mask').forEach(el => {
      if (window.getComputedStyle(el).display !== 'none') {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('.add-to-wishlist').forEach(containerFluid => {
      const customerSpan = containerFluid.querySelector('span:not([zid-visible-guest])');
      if (customerSpan && window.getComputedStyle(customerSpan).display === 'none') {
        customerSpan.style.setProperty('display', 'inline-block', 'important');
      }
    });

    const customerElements = document.querySelectorAll('[zid-visible-customer="true"]');
    customerElements.forEach(el => {
      if (window.getComputedStyle(el).display === 'none') {
        el.style.setProperty('display', 'inline-block', 'important');
      }
    });
  }, 1500);
}

window.addEventListener('vitrin:auth:success', async event => {

    if (window.zid?.account?.get) {
      try {
        const customerData = await window.zid.account.get();
        if (customerData) {
          // Update UI without reload
          updateUIAfterLogin(customerData);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
      }
  }

  // Fallback to page reload if zid account get fails
  window.location.reload();
});

/*
  Products filters: search inputs + price slider
  - Global keyword search: updates URL param q (server-side products search)
  - Per-attribute search: filters visible options within each attribute group (client-side)
  - Price range: jQuery UI range slider + from/to inputs
*/
function initProductsFiltersUI() {
  var containers = document.querySelectorAll('.products-filters-container');
  if (!containers || !containers.length) return;

  containers.forEach(function (filterContainer) {

  // ---- Global search (q param) ----
  (function initGlobalSearch() {
    var existingWrapper = filterContainer.querySelector('.search-filter-wrapper');
    if (!existingWrapper) {
      var header = filterContainer.querySelector('.filtration-header');
      if (!header) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'search-filter-wrapper';
      wrapper.innerHTML = ''
        + '<span class="search-filter-icon" role="button" tabindex="0" aria-label="search">'
        + '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
        + '    <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        + '    <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        + '  </svg>'
        + '</span>'
        + '<input class="search-filter-input" id="filter-product-search" type="search" placeholder="بحث" autocomplete="off" />';
      header.insertAdjacentElement('afterend', wrapper);
      existingWrapper = wrapper;
    }

    var searchInput = existingWrapper.querySelector('.search-filter-input');
    var searchIcon = existingWrapper.querySelector('.search-filter-icon');
    if (!searchInput) return;

    function applySearchFilter() {
      var searchTerm = String(searchInput.value || '').trim();
      var urlParams = new URLSearchParams(window.location.search);
      if (searchTerm) urlParams.set('q', searchTerm);
      else urlParams.delete('q');

      var query = urlParams.toString();
      window.location.href = window.location.pathname + (query ? '?' + query : '');
    }

    // Load existing q into input
    try {
      var urlParamsInit = new URLSearchParams(window.location.search);
      var existingKeyword = urlParamsInit.get('q');
      if (existingKeyword) searchInput.value = existingKeyword;
    } catch (e) { /* ignore */ }

    var searchDebounceTimer = null;
    var debounceMs = 280;

    // Avoid double-binding on re-init
    if (!searchInput.getAttribute('data-filter-search-bound')) {
      searchInput.setAttribute('data-filter-search-bound', '1');

      searchInput.addEventListener('input', function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(applySearchFilter, debounceMs);
      });

      searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(searchDebounceTimer);
          applySearchFilter();
        }
      });

      if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.style.pointerEvents = 'auto';
        searchIcon.addEventListener('click', function () {
          clearTimeout(searchDebounceTimer);
          applySearchFilter();
        });
        searchIcon.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchDebounceTimer);
            applySearchFilter();
          }
        });
      }
    }
  })();

  // ---- Per-attribute search (client-side) ----
  (function initAttributeSearches() {
    var groups = filterContainer.querySelectorAll('.attribute-group');
    if (!groups || !groups.length) return;

    groups.forEach(function (groupEl, idx) {
      // Skip price group (no .filter-row)
      if (!groupEl.querySelector('.filter-row')) return;

      var filterContent = groupEl.querySelector('.filter-content') || groupEl;
      var body = groupEl.querySelector('.attribute-body') || groupEl;
      var rows = body ? body.querySelectorAll('.filter-row') : [];
      if (!rows || !rows.length) return;

      var existing = groupEl.querySelector('.attribute-search-wrapper');
      if (!existing) {
        var wrap = document.createElement('div');
        wrap.className = 'attribute-search-wrapper';
        var nameEl = groupEl.querySelector('.attribute-name');
        var placeholder = nameEl ? ('بحث في ' + String(nameEl.textContent || '').trim()) : 'بحث';

        wrap.innerHTML = ''
          + '<span class="attribute-search-icon" role="button" tabindex="0" aria-label="search">'
          + '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
          + '    <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
          + '    <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
          + '  </svg>'
          + '</span>'
          + '<input class="attribute-search-input" type="search" placeholder="' + placeholder.replace(/"/g, '&quot;') + '" autocomplete="off" />';

        if (filterContent.firstChild) filterContent.insertBefore(wrap, filterContent.firstChild);
        else filterContent.appendChild(wrap);
        existing = wrap;
      }

      var input = existing.querySelector('.attribute-search-input');
      var icon = existing.querySelector('.attribute-search-icon');
      if (!input) return;

      // Bind once
      if (input.getAttribute('data-attr-search-bound')) return;
      input.setAttribute('data-attr-search-bound', '1');

      var t = null;
      var debounceMs = 120;

      function applyLocalFilter() {
        var term = String(input.value || '').trim().toLowerCase();
        var anyVisible = false;
        (body.querySelectorAll('.filter-row') || []).forEach(function (row) {
          var text = row.textContent ? row.textContent.trim().toLowerCase() : '';
          var match = !term || text.indexOf(term) !== -1;
          row.style.display = match ? '' : 'none';
          if (match) anyVisible = true;
        });

        // Hide/show "more" when searching
        var more = body.querySelector('.attribute-more');
        if (more) more.style.display = term ? 'none' : '';

        // If nothing matches, keep body height natural; optionally could show empty state later
        if (!anyVisible && term) {
          // no-op
        }
      }

      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(applyLocalFilter, debounceMs);
      });

      input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(t);
          applyLocalFilter();
        }
      });

      if (icon) {
        icon.style.cursor = 'pointer';
        icon.style.pointerEvents = 'auto';
        icon.addEventListener('click', function () {
          clearTimeout(t);
          applyLocalFilter();
          input.focus();
        });
      }

      // Keep group index deterministic for styling if needed
      groupEl.setAttribute('data-attribute-search-idx', String(idx));
    });
  })();

  // ---- Price range slider (client-side helper, still submits as from_price / to_price) ----
  (function initAttributePriceSlider() {
    var priceBody = filterContainer.querySelector('.attribute-price-body');
    if (!priceBody) return;

    var fromInput = priceBody.querySelector('input[name="from_price"]');
    var toInput = priceBody.querySelector('input[name="to_price"]');
    if (!fromInput || !toInput) return;

    var $ = window.jQuery;
    if (!$ || typeof $.fn.slider !== 'function') return;

    var slider = priceBody.querySelector('.attribute-price-slider');
    if (!slider) {
      slider = document.createElement('div');
      slider.className = 'attribute-price-slider ui-widget-bar';
      var footer = priceBody.querySelector('.attribute-footer');
      if (footer) {
        priceBody.insertBefore(slider, footer);
      } else {
        priceBody.appendChild(slider);
      }
    }

    var $slider = $(slider);
    if (!$slider.length) return;

    var minAttr = parseInt(fromInput.getAttribute('min'), 10);
    var maxAttr = parseInt(toInput.getAttribute('max'), 10);
    var minVal = !isNaN(minAttr) ? minAttr : 0;
    var maxVal = !isNaN(maxAttr) ? maxAttr : 100000;

    var currentFrom = parseInt(fromInput.value, 10);
    var currentTo = parseInt(toInput.value, 10);
    var initialMin = isNaN(currentFrom) ? minVal : Math.max(minVal, Math.min(currentFrom, maxVal));
    var initialMax = isNaN(currentTo) ? maxVal : Math.max(initialMin, Math.min(currentTo, maxVal));

    if ($slider.hasClass('ui-slider')) {
      $slider.slider('destroy');
    }

    $slider.slider({
      range: true,
      min: minVal,
      max: maxVal,
      values: [initialMin, initialMax],
      slide: function (event, ui) {
        fromInput.value = ui.values[0];
        toInput.value = ui.values[1];
      }
    });

    // Sync inputs -> slider
    function syncFrom() {
      var v = parseInt(fromInput.value, 10);
      if (isNaN(v)) v = minVal;
      v = Math.max(minVal, Math.min(v, $slider.slider('values', 1)));
      fromInput.value = v;
      $slider.slider('values', 0, v);
    }
    function syncTo() {
      var v = parseInt(toInput.value, 10);
      if (isNaN(v)) v = maxVal;
      v = Math.min(maxVal, Math.max(v, $slider.slider('values', 0)));
      toInput.value = v;
      $slider.slider('values', 1, v);
    }

    if (!fromInput.getAttribute('data-price-sync-bound')) {
      fromInput.setAttribute('data-price-sync-bound', '1');
      fromInput.addEventListener('change', syncFrom);
      fromInput.addEventListener('blur', syncFrom);
    }
    if (!toInput.getAttribute('data-price-sync-bound')) {
      toInput.setAttribute('data-price-sync-bound', '1');
      toInput.addEventListener('change', syncTo);
      toInput.addEventListener('blur', syncTo);
    }
  })();
  }); // end containers.forEach
}

// Init on load
document.addEventListener('DOMContentLoaded', function () {
  try { initProductsFiltersUI(); } catch (e) { /* ignore */ }
});

// Re-init after async filter actions (if handler exists)
(function hookOnProductAttributesChanged() {
  var original = window.onProductAttributesChanged;
  if (typeof original !== 'function') return;
  if (original && original.__filtersSearchHooked) return;

  function wrapped(htmlStr) {
    var res = original.call(this, htmlStr);
    try { initProductsFiltersUI(); } catch (e) { /* ignore */ }
    return res;
  }
  wrapped.__filtersSearchHooked = true;
  window.onProductAttributesChanged = wrapped;
})();