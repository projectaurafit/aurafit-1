/* ==========================================================
   AURA FIT - SEED DATA
   Catalogue schema follows the proposal (section 7):
   id, name, imageURL(->svg), category, colour, style,
   occasion, price, brand.
   ========================================================== */
(function (w) {
  'use strict';

  /* ---------------- taxonomy ---------------- */
  var CATEGORIES = [
    { id: 'top',        label: 'Tops',        icon: 'i-shirt',  kinds: ['tshirt', 'shirt', 'sweater'] },
    { id: 'bottom',     label: 'Bottoms',     icon: 'i-pants',  kinds: ['jeans', 'trousers', 'skirt', 'shorts'] },
    { id: 'dress',      label: 'Dresses',     icon: 'i-hanger', kinds: ['dress'] },
    { id: 'shoes',      label: 'Shoes',       icon: 'i-shoe',   kinds: ['sneaker', 'heel', 'boot'] },
    { id: 'outerwear',  label: 'Outerwear',   icon: 'i-hanger', kinds: ['blazer', 'coat'] },
    { id: 'bag',        label: 'Bags',        icon: 'i-bag',    kinds: ['bag'] },
    { id: 'accessory',  label: 'Accessories', icon: 'i-star',   kinds: ['hat', 'watch', 'accessory'] }
  ];

  var STYLES    = ['Casual', 'Formal', 'Professional', 'Streetwear', 'Party', 'Aesthetic', 'College', 'Traditional', 'Sporty', 'Minimal'];
  var OCCASIONS = ['Everyday', 'Office', 'College', 'Party', 'Date night', 'Travel', 'Wedding', 'Workout', 'Festive'];
  var SEASONS   = ['Spring', 'Summer', 'Autumn', 'Winter', 'All season'];

  var COLOURS = [
    { name: 'Ivory',      hex: '#F2EBE1' }, { name: 'Cream',      hex: '#EFE0CB' },
    { name: 'White',      hex: '#FAFAFA' }, { name: 'Beige',      hex: '#E0CFB6' },
    { name: 'Camel',      hex: '#C69B6D' }, { name: 'Tan',        hex: '#B8865B' },
    { name: 'Brown',      hex: '#6E4B32' }, { name: 'Black',      hex: '#1F1F1F' },
    { name: 'Charcoal',   hex: '#3A4044' }, { name: 'Grey',       hex: '#9AA0A4' },
    { name: 'Navy',       hex: '#26344D' }, { name: 'Denim blue', hex: '#6F92BC' },
    { name: 'Sky',        hex: '#A8C4E0' }, { name: 'Olive',      hex: '#6B7350' },
    { name: 'Sage',       hex: '#A8B79A' }, { name: 'Forest',     hex: '#37614A' },
    { name: 'Blush',      hex: '#EEC9CB' }, { name: 'Rose',       hex: '#C87F8E' },
    { name: 'Maroon',     hex: '#6E2F3A' }, { name: 'Red',        hex: '#B4423C' },
    { name: 'Mustard',    hex: '#D6A93E' }, { name: 'Rust',       hex: '#C1683C' },
    { name: 'Lavender',   hex: '#B9AECD' }, { name: 'Plum',       hex: '#6B5091' }
  ];
  function colourHex(name) {
    for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i].name === name) return COLOURS[i].hex;
    return '#D9D2CA';
  }

  var STORES = {
    Myntra:  function (q) { return 'https://www.myntra.com/' + encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-')); },
    Ajio:    function (q) { return 'https://www.ajio.com/search/?text=' + encodeURIComponent(q); },
    Amazon:  function (q) { return 'https://www.amazon.in/s?k=' + encodeURIComponent(q); },
    Zara:    function (q) { return 'https://www.zara.com/in/en/search?searchTerm=' + encodeURIComponent(q); },
    'H&M':   function (q) { return 'https://www2.hm.com/en_in/search-results.html?q=' + encodeURIComponent(q); },
    Nike:    function (q) { return 'https://www.nike.com/in/w?q=' + encodeURIComponent(q); },
    Uniqlo:  function (q) { return 'https://www.uniqlo.com/in/en/search?q=' + encodeURIComponent(q); }
  };

  /* ---------------- catalogue ---------------- */
  var _n = 0;
  /* name, brand, cat, kind, colour, style, occasion, price, mrp, store, rating */
  function P(name, brand, cat, kind, colour, style, occasion, price, mrp, store, rating) {
    _n++;
    return {
      id: 'p' + String(_n).padStart(3, '0'),
      name: name, brand: brand, cat: cat, kind: kind,
      colorName: colour, color: colourHex(colour),
      style: style, occasion: occasion,
      price: price, mrp: mrp || 0,
      store: store, rating: rating || (3.8 + Math.round(Math.random() * 12) / 10),
      url: STORES[store] ? STORES[store](brand + ' ' + name) : '#'
    };
  }

  var CATALOG = [
    /* ---- TOPS ---- */
    P('Relaxed Cotton Tee',        'H&M',    'top', 'tshirt',  'White',      'Casual',       'Everyday',   799,  1299, 'H&M'),
    P('Essential Crew Tee',        'Uniqlo', 'top', 'tshirt',  'Black',      'Minimal',      'Everyday',   990,  1490, 'Uniqlo'),
    P('Washed Boxy T-Shirt',       'Levis',  'top', 'tshirt',  'Sage',       'Streetwear',   'College',   1299,  1999, 'Myntra'),
    P('Soft Ribbed Tee',           'Zara',   'top', 'tshirt',  'Blush',      'Aesthetic',    'Date night',1590,     0, 'Zara'),
    P('Oversized Graphic Tee',     'Bewakoof','top','tshirt',  'Charcoal',   'Streetwear',   'College',    699,  1199, 'Myntra'),
    P('Poplin Office Shirt',       'Van Heusen','top','shirt', 'White',      'Professional', 'Office',    1899,  2799, 'Myntra'),
    P('Oxford Button-Down',        'Arrow',  'top', 'shirt',   'Sky',        'Formal',       'Office',    2199,  3299, 'Ajio'),
    P('Linen Blend Shirt',         'Zara',   'top', 'shirt',   'Beige',      'Casual',       'Travel',    2590,     0, 'Zara'),
    P('Slim Fit Formal Shirt',     'Peter England','top','shirt','Navy',     'Formal',       'Office',    1599,  2499, 'Myntra'),
    P('Cropped Satin Shirt',       'Mango',  'top', 'shirt',   'Ivory',      'Party',        'Party',     2790,  3490, 'Ajio'),
    P('Merino Wool Sweater',       'Uniqlo', 'top', 'sweater', 'Cream',      'Minimal',      'Everyday',  2990,  3990, 'Uniqlo'),
    P('Chunky Knit Pullover',      'Zara',   'top', 'sweater', 'Camel',      'Aesthetic',    'Everyday',  3290,     0, 'Zara'),
    P('Cable Knit Jumper',         'Marks',  'top', 'sweater', 'Ivory',      'Casual',       'Everyday',  2499,  3999, 'Amazon'),
    P('Half-Zip Sweatshirt',       'Nike',   'top', 'sweater', 'Olive',      'Sporty',       'Workout',   3495,  4295, 'Nike'),
    P('Turtleneck Knit Top',       'H&M',    'top', 'sweater', 'Black',      'Minimal',      'Date night',1799,  2299, 'H&M'),

    /* ---- BOTTOMS ---- */
    P('Straight Leg Jeans',        'Levis',  'bottom', 'jeans', 'Denim blue', 'Casual',      'Everyday',  3299,  4499, 'Myntra'),
    P('High Rise Mom Jeans',       'Zara',   'bottom', 'jeans', 'Sky',        'Aesthetic',   'College',   2990,     0, 'Zara'),
    P('Slim Tapered Jeans',        'Jack & Jones','bottom','jeans','Navy',    'Casual',      'Everyday',  2799,  3999, 'Ajio'),
    P('Black Skinny Jeans',        'H&M',    'bottom', 'jeans', 'Black',      'Streetwear',  'Party',     1999,  2799, 'H&M'),
    P('Wide Leg Denim',            'Uniqlo', 'bottom', 'jeans', 'Denim blue', 'Streetwear',  'College',   2990,     0, 'Uniqlo'),
    P('Tailored Wool Trousers',    'Arrow',  'bottom', 'trousers','Charcoal', 'Professional','Office',    2899,  4199, 'Myntra'),
    P('Pleated Formal Trousers',   'Van Heusen','bottom','trousers','Black',  'Formal',      'Office',    2499,  3499, 'Myntra'),
    P('Linen Wide Trousers',       'Mango',  'bottom', 'trousers','Cream',    'Minimal',     'Travel',    2690,  3290, 'Ajio'),
    P('Cargo Utility Pants',       'Bewakoof','bottom','trousers','Olive',    'Streetwear',  'College',   1499,  2299, 'Myntra'),
    P('Chino Slim Pants',          'Uniqlo', 'bottom', 'trousers','Beige',    'Casual',      'Everyday',  2290,     0, 'Uniqlo'),
    P('Pleated Midi Skirt',        'Zara',   'bottom', 'skirt', 'Ivory',      'Aesthetic',   'Date night',2490,     0, 'Zara'),
    P('A-Line Denim Skirt',        'H&M',    'bottom', 'skirt', 'Denim blue', 'Casual',      'College',   1599,  2199, 'H&M'),
    P('Satin Slip Skirt',          'Mango',  'bottom', 'skirt', 'Maroon',     'Party',       'Party',     2290,  2990, 'Ajio'),
    P('Cotton Lounge Shorts',      'Nike',   'bottom', 'shorts','Grey',       'Sporty',      'Workout',   1795,  2295, 'Nike'),
    P('Tailored Linen Shorts',     'Zara',   'bottom', 'shorts','Sage',       'Casual',      'Travel',    1990,     0, 'Zara'),

    /* ---- SHOES ---- */
    P('Court Leather Sneakers',    'Nike',   'shoes', 'sneaker', 'White',     'Casual',      'Everyday',  6295,  7995, 'Nike'),
    P('Retro Runner Sneakers',     'Adidas', 'shoes', 'sneaker', 'Cream',     'Streetwear',  'College',   7999,  9999, 'Myntra'),
    P('Canvas Low Tops',           'Converse','shoes','sneaker', 'Black',     'Casual',      'Everyday',  3499,  4499, 'Ajio'),
    P('Chunky Dad Sneakers',       'Puma',   'shoes', 'sneaker', 'Grey',      'Streetwear',  'College',   5499,  7499, 'Myntra'),
    P('Minimal Slip-On',           'Uniqlo', 'shoes', 'sneaker', 'Beige',     'Minimal',     'Travel',    2990,     0, 'Uniqlo'),
    P('Trail Running Shoes',       'Nike',   'shoes', 'sneaker', 'Olive',     'Sporty',      'Workout',   8995, 10995, 'Nike'),
    P('Pointed Stiletto Heels',    'Mango',  'shoes', 'heel',    'Black',     'Party',       'Party',     4290,  5490, 'Ajio'),
    P('Block Heel Pumps',          'Zara',   'shoes', 'heel',    'Cream',     'Professional','Office',    3990,     0, 'Zara'),
    P('Strappy Party Heels',       'Steve Madden','shoes','heel','Maroon',    'Party',       'Wedding',   6499,  8499, 'Myntra'),
    P('Chelsea Ankle Boots',       'Zara',   'shoes', 'boot',    'Brown',     'Casual',      'Everyday',  5990,     0, 'Zara'),
    P('Suede Desert Boots',        'Clarks', 'shoes', 'boot',    'Tan',       'Casual',      'Travel',    7999,  9999, 'Amazon'),
    P('Leather Derby Shoes',       'Hush Puppies','shoes','boot','Black',     'Formal',      'Office',    5499,  7499, 'Myntra'),

    /* ---- DRESSES ---- */
    P('Wrap Midi Dress',           'Zara',   'dress', 'dress', 'Black',       'Party',       'Party',     3990,     0, 'Zara'),
    P('Floral Summer Dress',       'H&M',    'dress', 'dress', 'Blush',       'Aesthetic',   'Date night',2499,  3499, 'H&M'),
    P('Linen Shirt Dress',         'Mango',  'dress', 'dress', 'Cream',       'Minimal',     'Travel',    3290,  4290, 'Ajio'),
    P('Bodycon Party Dress',       'Forever 21','dress','dress','Maroon',     'Party',       'Party',     2799,  3999, 'Myntra'),
    P('Pleated Occasion Dress',    'Zara',   'dress', 'dress', 'Sage',        'Formal',      'Wedding',   4590,     0, 'Zara'),
    P('Slip Satin Dress',          'Mango',  'dress', 'dress', 'Plum',        'Party',       'Party',     3690,  4690, 'Ajio'),

    /* ---- OUTERWEAR ---- */
    P('Structured Blazer',         'Zara',   'outerwear', 'blazer', 'Black',   'Professional','Office',   5990,     0, 'Zara'),
    P('Oversized Check Blazer',    'Mango',  'outerwear', 'blazer', 'Beige',   'Aesthetic',   'Office',   5290,  6990, 'Ajio'),
    P('Linen Summer Blazer',       'Arrow',  'outerwear', 'blazer', 'Sky',     'Formal',      'Wedding',  4499,  6499, 'Myntra'),
    P('Longline Trench Coat',      'Zara',   'outerwear', 'coat',   'Camel',   'Minimal',     'Travel',   8990,     0, 'Zara'),
    P('Wool Overcoat',             'Marks',  'outerwear', 'coat',   'Charcoal','Formal',      'Office',   9999, 13999, 'Amazon'),
    P('Puffer Jacket',             'Uniqlo', 'outerwear', 'coat',   'Navy',    'Casual',      'Travel',   5990,     0, 'Uniqlo'),

    /* ---- BAGS ---- */
    P('Structured Tote Bag',       'Zara',   'bag', 'bag', 'Tan',             'Professional','Office',   3990,     0, 'Zara'),
    P('Everyday Shoulder Bag',     'Mango',  'bag', 'bag', 'Black',           'Minimal',     'Everyday',  3290,  4290, 'Ajio'),
    P('Canvas Tote',               'H&M',    'bag', 'bag', 'Cream',           'Casual',      'College',    999,  1499, 'H&M'),
    P('Evening Clutch',            'Accessorize','bag','bag','Maroon',        'Party',       'Wedding',   2499,  3499, 'Myntra'),
    P('Leather Crossbody',         'Baggit', 'bag', 'bag', 'Brown',           'Casual',      'Travel',    2799,  3999, 'Myntra'),

    /* ---- ACCESSORIES ---- */
    P('Wide Brim Straw Hat',       'H&M',    'accessory', 'hat',   'Beige',   'Aesthetic',   'Travel',    1299,  1799, 'H&M'),
    P('Wool Felt Fedora',          'Zara',   'accessory', 'hat',   'Charcoal','Minimal',     'Everyday',  1990,     0, 'Zara'),
    P('Minimal Analog Watch',      'Fossil', 'accessory', 'watch', 'Tan',     'Professional','Office',    8995, 11995, 'Amazon'),
    P('Steel Link Watch',          'Titan',  'accessory', 'watch', 'Grey',    'Formal',      'Wedding',   6499,  8499, 'Myntra'),
    P('Gold Hoop Set',             'Accessorize','accessory','accessory','Mustard','Party',  'Party',      899,  1299, 'Myntra')
  ];

  /* ---------------- starter wardrobe ---------------- */
  var _w = 0;
  function W(name, cat, kind, colour, style, occasion, brand, notes, season) {
    _w++;
    return {
      id: 'w' + String(_w).padStart(3, '0'),
      name: name, cat: cat, kind: kind,
      colorName: colour, color: colourHex(colour),
      style: style, occasion: occasion, brand: brand,
      notes: notes || '', season: season || 'All season',
      photo: null,
      createdAt: Date.now() - _w * 86400000
    };
  }

  var WARDROBE = [
    W('Cream Knit Sweater',   'top',    'sweater', 'Cream',      'Minimal',      'Everyday',  'Zara',   'Softest one I own. Great with denim.', 'Winter'),
    W('White Cotton Tee',     'top',    'tshirt',  'White',      'Casual',       'Everyday',  'Uniqlo', 'Goes with everything.', 'Summer'),
    W('Black Turtleneck',     'top',    'sweater', 'Black',      'Minimal',      'Date night','H&M',    '', 'Winter'),
    W('Blue Oxford Shirt',    'top',    'shirt',   'Sky',        'Professional', 'Office',    'Arrow',  'Interview shirt.', 'All season'),
    W('Light Wash Jeans',     'bottom', 'jeans',   'Sky',        'Casual',       'Everyday',  'Levis',  'Slightly cropped.', 'All season'),
    W('Dark Denim Jeans',     'bottom', 'jeans',   'Navy',       'Casual',       'College',   'Levis',  '', 'All season'),
    W('Black Trousers',       'bottom', 'trousers','Black',      'Formal',       'Office',    'Van Heusen', 'Needs pressing before use.', 'All season'),
    W('Beige Chinos',         'bottom', 'trousers','Beige',      'Casual',       'Everyday',  'Uniqlo', '', 'Summer'),
    W('White Sneakers',       'shoes',  'sneaker', 'White',      'Casual',       'Everyday',  'Nike',   'Clean these before the party.', 'All season'),
    W('Black Heels',          'shoes',  'heel',    'Black',      'Party',        'Party',     'Mango',  '', 'All season'),
    W('Brown Chelsea Boots',  'shoes',  'boot',    'Brown',      'Casual',       'Travel',    'Zara',   '', 'Winter'),
    W('Camel Trench Coat',    'outerwear','coat',  'Camel',      'Minimal',      'Travel',    'Zara',   'Best autumn layer.', 'Autumn'),
    W('Black Blazer',         'outerwear','blazer','Black',      'Professional', 'Office',    'Zara',   '', 'All season'),
    W('Little Black Dress',   'dress',  'dress',   'Black',      'Party',        'Party',     'Zara',   '', 'All season'),
    W('Blush Midi Dress',     'dress',  'dress',   'Blush',      'Aesthetic',    'Date night','H&M',    '', 'Spring'),
    W('Tan Leather Tote',     'bag',    'bag',     'Tan',        'Professional', 'Office',    'Zara',   '', 'All season'),
    W('Straw Sun Hat',        'accessory','hat',   'Beige',      'Aesthetic',    'Travel',    'H&M',    '', 'Summer'),
    W('Gold Watch',           'accessory','watch', 'Mustard',    'Formal',       'Wedding',   'Titan',  '', 'All season')
  ];

  /* ---------------- starter outfits ---------------- */
  var OUTFITS = [
    { id: 'o1', name: 'Casual Day Out', items: ['w001', 'w005', 'w009', 'w016'], occasion: 'Everyday',   season: 'Spring', notes: 'Perfect for a casual day out with friends.', fav: true },
    { id: 'o2', name: 'Office Look',    items: ['w004', 'w007', 'w013', 'w016'], occasion: 'Office',     season: 'All season', notes: 'Sharp without trying too hard.', fav: false },
    { id: 'o3', name: 'Weekend Vibes',  items: ['w002', 'w006', 'w009'],          occasion: 'College',    season: 'Summer', notes: 'Easy weekend uniform.', fav: false },
    { id: 'o4', name: 'Evening Out',    items: ['w014', 'w010', 'w016'],          occasion: 'Party',      season: 'All season', notes: 'Little black dress does the work.', fav: true },
    { id: 'o5', name: 'Coffee Date',    items: ['w015', 'w011', 'w017'],          occasion: 'Date night', season: 'Spring', notes: 'Soft, warm and easy.', fav: false },
    { id: 'o6', name: 'Layered Autumn', items: ['w003', 'w008', 'w011', 'w012'],  occasion: 'Travel',     season: 'Autumn', notes: 'Trench does the heavy lifting.', fav: false },
    { id: 'o7', name: 'Campus Ready',   items: ['w002', 'w005', 'w009'],          occasion: 'College',    season: 'All season', notes: '', fav: false },
    { id: 'o8', name: 'Smart Formal',   items: ['w004', 'w007', 'w013'],          occasion: 'Wedding',    season: 'All season', notes: 'Add the gold watch.', fav: false }
  ];

  /* ---------------- AI stylist canned prompts ---------------- */
  var PROMPTS = [
    'What should I wear for college?',
    'I have a presentation tomorrow',
    'Something for a dinner date',
    'Comfortable travel outfit',
    'Weekend brunch look'
  ];

  w.Data = {
    CATEGORIES: CATEGORIES,
    STYLES: STYLES,
    OCCASIONS: OCCASIONS,
    SEASONS: SEASONS,
    COLOURS: COLOURS,
    colourHex: colourHex,
    CATALOG: CATALOG,
    WARDROBE: WARDROBE,
    OUTFITS: OUTFITS,
    PROMPTS: PROMPTS,
    catLabel: function (id) {
      for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
      return id;
    }
  };
})(window);
