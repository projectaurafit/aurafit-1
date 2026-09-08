/* ==========================================================
   SCREENS - ADD ITEM / CLOTHING
   Reached from the floating "+" button (bottom-right).
   Adds a single clothing item, or a complete outfit built
   from pieces already in the wardrobe.
   ========================================================== */
(function (w) {
  'use strict';
  var U = w.UI, S = w.Store, D = w.Data, G = w.Garments;
  var Screens = w.Screens = w.Screens || {};

  var mode = 'item';       // item | outfit
  var photo = null;
  var editId = null;
  var picked = [];         // outfit mode: item ids
  var form = null;
  var dirty = false, photoBusy = false, photoVersion = 0, liveView = null;
  var unloadGuard = null, initialValues = '';

  function values(view) {
    return JSON.stringify(U.$$('input:not([type=file]),select,textarea', view).map(function (input) { return input.value; }));
  }
  function isDirty() { return dirty || !!(liveView && values(liveView) !== initialValues); }

  function blank() {
    return {
      name: '', cat: 'top', kind: 'tshirt', colorName: 'Ivory',
      style: 'Casual', occasion: 'Everyday', season: 'All season',
      brand: '', notes: ''
    };
  }

  function kindsFor(cat) {
    for (var i = 0; i < D.CATEGORIES.length; i++) if (D.CATEGORIES[i].id === cat) return D.CATEGORIES[i].kinds;
    return ['tshirt'];
  }
  function kindLabel(k) {
    return ({
      tshirt: 'T-Shirt', shirt: 'Shirt', sweater: 'Sweater / Knit',
      jeans: 'Jeans', trousers: 'Trousers', skirt: 'Skirt', shorts: 'Shorts',
      dress: 'Dress', blazer: 'Blazer', coat: 'Coat / Jacket',
      sneaker: 'Sneakers', heel: 'Heels', boot: 'Boots',
      bag: 'Bag', hat: 'Hat', watch: 'Watch', accessory: 'Accessory'
    })[k] || k;
  }

  function sel(id, label, options, value) {
    return '<div class="field">' +
      '<label class="field__label" for="' + id + '">' + label + '</label>' +
      '<select class="select" id="' + id + '">' + options.map(function (o) {
        var v = typeof o === 'string' ? o : o.v, t = typeof o === 'string' ? o : o.t;
        return '<option value="' + U.esc(v) + '"' + (v === value ? ' selected' : '') + '>' + U.esc(t) + '</option>';
      }).join('') + '</select>' +
    '</div>';
  }

  /* downscale before storing so localStorage stays healthy */
  function readPhoto(file, cb) {
    if (file.size > 20 * 1024 * 1024) { cb(null, null, 'Choose a photo smaller than 20 MB.'); return; }
    var r = new FileReader();
    r.onerror = function () { cb(null, null, 'This photo could not be read. Please choose another.'); };
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        try {
          var max = 640;
          var s = Math.min(1, max / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.width * s));
          cv.height = Math.max(1, Math.round(img.height * s));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          var detected = w.Colour ? w.Colour.fromCanvas(cv, D.COLOURS) : null;
          cb(cv.toDataURL('image/jpeg', 0.82), detected);
        } catch (e) { cb(null, null, 'This image could not be processed. Try a JPG or PNG photo.'); }
      };
      img.onerror = function () { cb(null, null, 'This file is not a readable image. Try a JPG or PNG photo.'); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function dropzoneHTML() {
    if (photo) {
      return '<div class="dropzone has-img">' +
        '<div class="dropzone__preview"><img src="' + photo + '" alt="Item photo"></div>' +
        '<button type="button" class="dropzone__change" data-repick>' + U.icon('i-camera', 'ico--sm') + ' Change</button>' +
      '</div>';
    }
    return '<button type="button" class="dropzone" data-pickfile>' +
      '<span class="dropzone__ico">' + U.icon('i-hanger', 'ico--xl') + '</span>' +
      '<span class="dropzone__t">Add Photo</span>' +
      '<span class="dropzone__s">Tap to upload, or drop an image here</span>' +
    '</button>';
  }

  Screens.add = {
    shell: true,
    tab: 'wardrobe',
    topbar: function (params) {
      return {
        back: true,
        title: params.edit ? (params.mode === 'outfit' ? 'Edit Outfit' : 'Edit Item') : (params.mode === 'outfit' ? 'Create Outfit' : 'Add New Item'),
        right: '<button class="iconbtn" data-save aria-label="Save">' + U.icon('i-check') + '</button>'
      };
    },

    render: function (params) {
      editId = params.edit || null;
      mode = params.mode === 'outfit' ? 'outfit' : 'item';
      var src = editId ? (mode === 'outfit' ? S.getOutfit(editId) : S.getItem(editId)) : null;
      dirty = false; photoBusy = false;
      if (editId && !src) return '<div class="empty"><h1 class="empty__t">' + (mode === 'outfit' ? 'Outfit' : 'Item') + ' not found</h1><p class="empty__s">It may have been removed. Choose another from your wardrobe.</p><button class="btn btn--primary" data-go="#/wardrobe">Back to wardrobe</button></div>';
      form = src ? Object.assign(blank(), src) : blank();
      photo = src ? (src.photo || null) : null;
      picked = mode === 'outfit' && src ? src.items.slice() : [];

      if (mode === 'outfit') return renderOutfit();

      return '' +
      (editId ? '' :
        '<div class="segment" style="margin:8px 0 20px">' +
          '<button class="segment__btn is-active" data-mode="item">' + U.icon('i-shirt', 'ico--sm') + ' Single item</button>' +
          '<button class="segment__btn" data-mode="outfit">' + U.icon('i-hanger', 'ico--sm') + ' Complete outfit</button>' +
        '</div>') +

      '<div class="detail__grid">' +
        '<div>' +
          '<div data-dz>' + dropzoneHTML() + '</div>' +
          '<div class="photo-opts">' +
            '<button class="btn btn--ghost btn--sm" data-pickfile>' + U.icon('i-image', 'ico--sm') + ' Upload</button>' +
            '<button class="btn btn--ghost btn--sm" data-camera>' + U.icon('i-camera', 'ico--sm') + ' Camera</button>' +
          '</div>' +
          '<input type="file" accept="image/*" hidden data-file>' +
          '<input type="file" accept="image/*" capture="environment" hidden data-cam>' +
          '<p class="t-xs t-faint" style="margin-top:12px">No photo? Aura Fit will draw a preview from the category and colour you choose.</p>' +
        '</div>' +

        '<form data-form>' +
          '<div class="field">' +
            '<label class="field__label" for="f-name">Item name</label>' +
            '<input class="input" id="f-name" maxlength="120" placeholder="e.g. Cream Knit Sweater" value="' + U.esc(form.name) + '">' +
          '</div>' +

          sel('f-cat', 'Category', D.CATEGORIES.map(function (c) { return { v: c.id, t: c.label }; }), form.cat) +
          '<div data-kindwrap>' +
            sel('f-kind', 'Type', kindsFor(form.cat).map(function (k) { return { v: k, t: kindLabel(k) }; }), form.kind) +
          '</div>' +

          '<div class="field">' +
            '<label class="field__label">Colour</label>' +
            '<div class="swatches">' + D.COLOURS.map(function (c) {
              var on = c.name === form.colorName;
              var check = G.luma(c.hex) > 0.6 ? '#222' : '#fff';
              return '<button type="button" class="swatch' + (on ? ' is-active' : '') + '" data-colour="' + U.esc(c.name) + '" ' +
                'title="' + U.esc(c.name) + '" aria-pressed="' + on + '" aria-label="' + U.esc(c.name) + '" ' +
                'style="background:' + c.hex + ';--swatch-check:' + check + '"></button>';
            }).join('') + '</div>' +
            '<p class="t-xs t-faint" style="margin-top:10px" data-colourlbl>' + U.esc(form.colorName) + '</p>' +
          '</div>' +

          sel('f-style', 'Style', D.STYLES, form.style) +
          sel('f-occ', 'Occasion', D.OCCASIONS, form.occasion) +
          sel('f-season', 'Season', D.SEASONS, form.season) +

          '<div class="field">' +
            '<label class="field__label" for="f-brand">Brand</label>' +
            '<input class="input" id="f-brand" maxlength="80" placeholder="e.g. Zara" value="' + U.esc(form.brand) + '" list="brandlist">' +
            '<datalist id="brandlist">' +
              ['Zara', 'H&M', 'Uniqlo', 'Levis', 'Nike', 'Adidas', 'Mango', 'Arrow', 'Van Heusen', 'Puma']
                .map(function (b) { return '<option value="' + b + '">'; }).join('') +
            '</datalist>' +
          '</div>' +

          '<div class="field">' +
            '<label class="field__label" for="f-notes">Notes</label>' +
            '<textarea class="textarea" id="f-notes" maxlength="1000" placeholder="Fit, styling reminders, where you bought it…">' + U.esc(form.notes) + '</textarea>' +
          '</div>' +

          '<button type="submit" class="btn btn--primary btn--block btn--lg">' +
            (editId ? 'Save changes' : 'Add to wardrobe') + '</button>' +
        '</form>' +
      '</div>';
    },

    hasUnsavedChanges: isDirty,
    unmount: function () {
      photoVersion++;
      liveView = null;
      if (unloadGuard) window.removeEventListener('beforeunload', unloadGuard);
    },
    mount: function (view, params) {
      if (!view.querySelector('[data-form]')) {
        var missingSave = document.querySelector('.topbar [data-save]');
        if (missingSave) missingSave.disabled = true;
        return;
      }
      liveView = view; initialValues = values(view);
      unloadGuard = function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } };
      window.addEventListener('beforeunload', unloadGuard);
      if (mode === 'outfit') return mountOutfit(view);

      var dz = view.querySelector('[data-dz]');
      var file = view.querySelector('[data-file]');
      var cam = view.querySelector('[data-cam]');

      function refreshDZ() { dz.innerHTML = dropzoneHTML(); }
      function upload(f) {
        if (!/^image\//.test(f.type)) return U.toast('Please choose an image file.', 'error');
        var version = ++photoVersion;
        photoBusy = true;
        var buttons = U.$$('.topbar [data-save], [data-form] button[type="submit"]');
        buttons.forEach(function (b) { b.disabled = true; b.setAttribute('aria-busy', 'true'); });
        readPhoto(f, function (data, detected, error) {
          if (version !== photoVersion || !view.isConnected) return;
          photoBusy = false;
          buttons.forEach(function (b) { b.disabled = false; b.removeAttribute('aria-busy'); });
          if (error) return U.toast(error, 'error');
          photo = data; dirty = true; refreshDZ(); selectColour(detected);
          U.toast(detected ? 'Photo added · colour set to ' + detected : 'Photo added', 'success');
        });
      }

      function selectColour(name) {
        if (!name) return;
        form.colorName = name;
        U.$$('[data-colour]', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.colour === name);
          b.setAttribute('aria-pressed', String(b.dataset.colour === name));
        });
        var lbl = view.querySelector('[data-colourlbl]');
        if (lbl) lbl.innerHTML = U.esc(name) +
          ' <span class="t-faint">· detected from your photo</span>';
      }

      U.on(view, 'click', '[data-pickfile],[data-repick]', function () { file.click(); });
      U.on(view, 'click', '[data-camera]', function () { cam.click(); });

      [file, cam].forEach(function (inp) {
        inp.addEventListener('change', function () {
          var f = inp.files && inp.files[0];
          if (!f) return;
          upload(f);
          inp.value = '';
        });
      });

      /* drag & drop */
      ['dragenter', 'dragover'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) {
          e.preventDefault();
          var z = dz.querySelector('.dropzone'); if (z) z.classList.add('is-drag');
        });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) {
          e.preventDefault();
          var z = dz.querySelector('.dropzone'); if (z) z.classList.remove('is-drag');
        });
      });
      dz.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files[0];
        if (f) upload(f);
      });

      /* category -> type list */
      var catSel = view.querySelector('#f-cat');
      catSel.addEventListener('change', function () {
        form.cat = catSel.value;
        var ks = kindsFor(form.cat);
        form.kind = ks[0];
        view.querySelector('[data-kindwrap]').innerHTML =
          sel('f-kind', 'Type', ks.map(function (k) { return { v: k, t: kindLabel(k) }; }), form.kind);
      });

      U.on(view, 'click', '[data-colour]', function (e, t) {
        form.colorName = t.dataset.colour;
        dirty = true;
        U.$$('[data-colour]', view).forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.colour === form.colorName);
          b.setAttribute('aria-pressed', String(b.dataset.colour === form.colorName));
        });
        view.querySelector('[data-colourlbl]').textContent = form.colorName;
      });

      function save() {
        if (photoBusy) return U.toast('Please wait for the photo to finish processing.');
        var name = view.querySelector('#f-name').value.trim();
        var cat = view.querySelector('#f-cat').value;
        var kind = view.querySelector('#f-kind').value;
        if (!name) {
          name = form.colorName + ' ' + kindLabel(kind);
        }
        var payload = {
          name: name, cat: cat, kind: kind,
          colorName: form.colorName, color: D.colourHex(form.colorName),
          style: view.querySelector('#f-style').value,
          occasion: view.querySelector('#f-occ').value,
          season: view.querySelector('#f-season').value,
          brand: view.querySelector('#f-brand').value.trim(),
          notes: view.querySelector('#f-notes').value.trim(),
          photo: photo
        };
        if (editId) {
          S.updateItem(editId, payload);
          dirty = false; initialValues = values(view);
          U.toast('Item updated', 'success');
          w.Router.go('#/item/' + editId);
        } else {
          var it = S.addItem(payload);
          dirty = false; initialValues = values(view);
          U.toast('Added to your wardrobe', 'success');
          w.Router.go('#/item/' + it.id);
        }
      }

      view.querySelector('[data-form]').addEventListener('submit', function (e) { e.preventDefault(); save(); });
      var topSave = document.querySelector('.topbar [data-save]');
      if (topSave) topSave.onclick = save;

      U.on(view, 'click', '[data-mode]', function (e, t) {
        w.Router.go('#/add' + (t.dataset.mode === 'outfit' ? '?mode=outfit' : ''), true);
      });
    }
  };

  /* ================= OUTFIT BUILDER ================= */
  function renderOutfit() {
    var wr = S.state.wardrobe;
    return '' +
    (editId ? '' : '<div class="segment" style="margin:8px 0 20px">' +
      '<button class="segment__btn" data-mode="item">' + U.icon('i-shirt', 'ico--sm') + ' Single item</button>' +
      '<button class="segment__btn is-active" data-mode="outfit">' + U.icon('i-hanger', 'ico--sm') + ' Complete outfit</button>' +
    '</div>') +

    '<div class="card card--pad" style="margin-bottom:20px">' +
      '<div class="af-row gap4">' +
        '<div class="thumb" style="width:110px;height:auto;flex:none" data-preview>' +
          w.Garments.outfit({}, { label: 'New outfit' }) + '</div>' +
        '<div class="grow">' +
          '<div class="t-bold" style="font-size:var(--fs-h2)">Build a look</div>' +
          '<div class="t-sm t-dim" style="margin-top:4px">Pick the pieces that go together. ' +
            '<span data-count>0</span> selected.</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<form data-form>' +
      '<div class="field">' +
        '<label class="field__label" for="o-name">Outfit name</label>' +
        '<input class="input" id="o-name" maxlength="120" value="' + U.esc(form.name) + '" placeholder="e.g. Casual Day Out">' +
      '</div>' +
      sel('o-occ', 'Occasion', D.OCCASIONS, form.occasion) +
      sel('o-season', 'Season', D.SEASONS, form.season) +
      '<div class="field">' +
        '<label class="field__label" for="o-notes">Notes</label>' +
        '<textarea class="textarea" id="o-notes" maxlength="1000" placeholder="When would you wear this?">' + U.esc(form.notes) + '</textarea>' +
      '</div>' +
    '</form>' +

    '<div class="sec">' +
      '<div class="sec__head"><div class="sec__title">Choose pieces</div>' +
        '<span class="sec__link" data-count2>0 selected</span></div>' +
      (wr.length
        ? '<div class="itemgrid">' + wr.map(function (i) {
            return '<button class="itemcard" data-toggle="' + i.id + '">' +
              '<span class="itemcard__thumb" style="position:relative">' +
                (i.photo ? '<img src="' + i.photo + '" alt="" style="width:100%;height:100%;object-fit:cover">'
                         : G.garment({ color: i.color, kind: i.kind, cat: i.cat, label: i.name })) +
                '<span class="prodcard__tick">' + U.icon('i-check') + '</span>' +
              '</span>' +
              '<span class="itemcard__name trunc">' + U.esc(i.name) + '</span>' +
              '<span class="itemcard__meta">' + U.esc(D.catLabel(i.cat)) + '</span>' +
            '</button>';
          }).join('') + '</div>'
        : '<div class="empty"><div class="empty__ico">' + U.icon('i-hanger', 'ico--lg') + '</div>' +
          '<div class="empty__t">Your wardrobe is empty</div>' +
          '<div class="empty__s">Add a few items first, then combine them into outfits.</div></div>') +
    '</div>' +

    '<button class="btn btn--primary btn--block btn--lg" style="margin-top:24px" data-saveoutfit>Save outfit</button>';
  }

  function mountOutfit(view) {
    function refresh() {
      U.$$('[data-toggle]', view).forEach(function (b) {
        b.classList.toggle('is-selected', picked.indexOf(b.dataset.toggle) >= 0);
        b.setAttribute('aria-pressed', String(picked.indexOf(b.dataset.toggle) >= 0));
      });
      var n = picked.length;
      var c1 = view.querySelector('[data-count]'), c2 = view.querySelector('[data-count2]');
      if (c1) c1.textContent = n;
      if (c2) c2.textContent = n + ' selected';
      var prev = view.querySelector('[data-preview]');
      if (prev) {
        prev.innerHTML = w.Garments.outfit(S.outfitParts({ items: picked }), { label: 'Preview' });
      }
    }

    U.on(view, 'click', '[data-toggle]', function (e, t) {
      var id = t.dataset.toggle;
      dirty = true;
      var i = picked.indexOf(id);
      if (i >= 0) picked.splice(i, 1);
      else {
        if (picked.length >= 6) return U.toast('An outfit can hold up to 6 pieces.', 'error');
        picked.push(id);
      }
      refresh();
    });

    function save() {
      if (picked.length < 2) return U.toast('Pick at least two pieces.', 'error');
      var name = view.querySelector('#o-name').value.trim();
      var payload = {
        name: name || 'New Outfit',
        items: picked.slice(),
        occasion: view.querySelector('#o-occ').value,
        season: view.querySelector('#o-season').value,
        notes: view.querySelector('#o-notes').value.trim()
      };
      var o = editId ? S.updateOutfit(editId, payload) : S.addOutfit(payload);
      dirty = false; initialValues = values(view);
      U.toast(editId ? 'Outfit updated' : 'Outfit saved', 'success');
      w.Router.go('#/outfit/' + o.id);
    }

    view.querySelector('[data-saveoutfit]').onclick = save;
    var topSave = document.querySelector('.topbar [data-save]');
    if (topSave) topSave.onclick = save;
    view.querySelector('[data-form]').addEventListener('submit', function (e) { e.preventDefault(); save(); });

    U.on(view, 'click', '[data-mode]', function (e, t) {
      w.Router.go('#/add' + (t.dataset.mode === 'outfit' ? '?mode=outfit' : ''), true);
    });

    refresh();
  }
})(window);
