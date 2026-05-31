import React from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'supporter',
    title: 'SUPPORTER CULTURE',
    subtitle: 'The Heart of Football',
    description: 'From passionate supporters to casual fans, our Supporter Culture collection celebrates the vibrant spirit of football. Wear your allegiance with pride through our premium jerseys, scarves, caps, and accessories that represent the true essence of fandom.',
    image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=1200&q=80',
    color: '#8B0000',
    products: [
      { id: 1, name: 'Premium Jersey', price: 'Rp 299.000', image: 'https://via.placeholder.com/300x300?text=Jersey' },
      { id: 2, name: 'Supporter Scarf', price: 'Rp 199.000', image: 'https://via.placeholder.com/300x300?text=Scarf' },
      { id: 3, name: 'Football Cap', price: 'Rp 149.000', image: 'https://via.placeholder.com/300x300?text=Cap' },
      { id: 4, name: 'Fan Badge Set', price: 'Rp 99.000', image: 'https://via.placeholder.com/300x300?text=Badge' },
    ]
  },
  {
    id: 'outdoor',
    title: 'OUTDOOR ADVENTURE',
    subtitle: 'Explore Without Limits',
    description: 'Conquer the wilderness with our Outdoor collection. Built for durability and style, our range includes rugged backpacks, weather-resistant jackets, and versatile gear designed for modern adventurers who refuse to compromise on fashion.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    color: '#2A6B3C',
    products: [
      { id: 5, name: 'Hiking Backpack', price: 'Rp 699.000', image: 'https://via.placeholder.com/300x300?text=Backpack' },
      { id: 6, name: 'Windbreaker Jacket', price: 'Rp 549.000', image: 'https://via.placeholder.com/300x300?text=Jacket' },
      { id: 7, name: 'Trail Pants', price: 'Rp 399.000', image: 'https://via.placeholder.com/300x300?text=Pants' },
      { id: 8, name: 'Outdoor Tee', price: 'Rp 199.000', image: 'https://via.placeholder.com/300x300?text=Tee' },
    ]
  },
  {
    id: 'fishing',
    title: 'FISHING LIFESTYLE',
    subtitle: 'Born to Fish',
    description: 'For the water enthusiasts and fishing aficionados. Our Fishing collection blends functionality with coastal style. From moisture-wicking shirts to strategic pocket designs, each piece is crafted for those who live for the catch.',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    color: '#1E3A5F',
    products: [
      { id: 9, name: 'Fishing Shirt', price: 'Rp 279.000', image: 'https://via.placeholder.com/300x300?text=FishingShirt' },
      { id: 10, name: 'UV Protection Hat', price: 'Rp 169.000', image: 'https://via.placeholder.com/300x300?text=Hat' },
      { id: 11, name: 'Cargo Shorts', price: 'Rp 249.000', image: 'https://via.placeholder.com/300x300?text=Shorts' },
      { id: 12, name: 'Fishing Vest', price: 'Rp 399.000', image: 'https://via.placeholder.com/300x300?text=Vest' },
    ]
  },
  {
    id: 'running',
    title: 'RUNNING PERFORMANCE',
    subtitle: 'Push Your Limits',
    description: 'Engineered for athletes and fitness enthusiasts. Our Running collection features breathable fabrics, ergonomic designs, and eye-catching styles. Whether you\'re sprinting marathons or hitting the gym, perform at your peak without sacrificing street style.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80',
    color: '#FF6B35',
    products: [
      { id: 13, name: 'Performance Tee', price: 'Rp 229.000', image: 'https://via.placeholder.com/300x300?text=PerfTee' },
      { id: 14, name: 'Running Shorts', price: 'Rp 279.000', image: 'https://via.placeholder.com/300x300?text=RunShorts' },
      { id: 15, name: 'Sports Bra', price: 'Rp 319.000', image: 'https://via.placeholder.com/300x300?text=SportsBra' },
      { id: 16, name: 'Compression Wear', price: 'Rp 349.000', image: 'https://via.placeholder.com/300x300?text=Compression' },
    ]
  },
];

export default function HomePage() {
  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative w-full h-screen bg-aria-cream flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1540575467063-178f50002c4b?w=1400&q=80)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-aria-cream/80"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
          <div className="mb-2 text-sm font-bold text-aria-maroon tracking-widest uppercase">Est. 2024 • Premium Streetwear</div>
          <h1 className="text-6xl md:text-8xl font-black text-black mb-6 leading-tight tracking-tighter">
            AGAINST<br />MODERN<br />FOOTBALL
          </h1>
          <p className="text-lg md:text-xl text-aria-charcoal mb-10 font-medium leading-relaxed">
            Authentic streetwear for casual supporters, outdoor enthusiasts, and those who live for culture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/products" 
              className="bg-aria-maroon text-white px-12 py-4 font-bold uppercase tracking-wider hover:bg-aria-darkgray transition-all duration-300 transform hover:scale-105"
            >
              Shop Now
            </Link>
            <Link 
              to="/sablon" 
              className="border-2 border-black text-black px-12 py-4 font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300"
            >
              Custom Design
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY SECTIONS */}
      {CATEGORIES.map((category, index) => (
        <section key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-aria-lightgray'}>
          {/* Category Header with Image */}
          <div className="relative w-full h-96 overflow-hidden">
            <img 
              src={category.image}
              alt={category.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
              <div className="text-sm font-bold tracking-widest uppercase mb-2 opacity-90">{category.subtitle}</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{category.title}</h2>
            </div>
          </div>

          {/* Article & Products */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16">
            {/* Article Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
              <div className="lg:col-span-2">
                <div className="inline-block mb-4 px-3 py-1 bg-aria-lightgray">
                  <span className="text-xs font-bold text-aria-charcoal tracking-widest uppercase">Featured Category</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-black mb-6 leading-tight">
                  {category.title}
                </h3>
                <p className="text-lg text-aria-charcoal leading-relaxed mb-8 font-medium">
                  {category.description}
                </p>
                <Link 
                  to={`/products?category=${category.id}`}
                  className="inline-flex items-center font-bold text-black hover:text-aria-maroon transition-colors uppercase tracking-wider"
                >
                  Explore Collection →
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col justify-center space-y-6">
                <div className="border-l-4 border-aria-maroon pl-4">
                  <div className="text-3xl font-black text-black">100+</div>
                  <p className="text-sm text-aria-charcoal font-medium">Products</p>
                </div>
                <div className="border-l-4 border-black pl-4">
                  <div className="text-3xl font-black text-black">Premium</div>
                  <p className="text-sm text-aria-charcoal font-medium">Quality Guaranteed</p>
                </div>
                <div className="border-l-4 border-aria-charcoal pl-4">
                  <div className="text-3xl font-black text-black">Free</div>
                  <p className="text-sm text-aria-charcoal font-medium">Shipping on Orders</p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="mb-8">
              <h4 className="text-sm font-black text-aria-charcoal tracking-widest uppercase mb-8">Featured Products</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {category.products.map((product) => (
                  <Link 
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group"
                  >
                    <div className="relative bg-aria-cream aspect-square mb-4 overflow-hidden border border-aria-lightgray group-hover:border-black transition-all duration-300">
                      <img 
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h5 className="text-xs md:text-sm font-bold text-black uppercase tracking-wider mb-2 group-hover:text-aria-maroon transition-colors">
                      {product.name}
                    </h5>
                    <p className="text-sm md:text-base font-black text-aria-charcoal">
                      {product.price}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* View All Link */}
            <div className="text-center pt-8 border-t border-aria-lightgray">
              <Link 
                to={`/products?category=${category.id}`}
                className="inline-block px-8 py-3 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300"
              >
                View All {category.title}
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* CUSTOM SABLON SECTION */}
      <section className="w-full bg-aria-charcoal text-aria-cream py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 text-center">
          <div className="mb-4 text-sm font-bold text-aria-maroon tracking-widest uppercase">Create Your Vision</div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter leading-tight">
            Custom Sablon Design
          </h2>
          <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Design your own story. From club colors to personal designs, our custom sablon service brings your vision to life on premium apparel.
          </p>
          <Link 
            to="/sablon"
            className="inline-block bg-aria-cream text-aria-charcoal px-12 py-4 font-bold uppercase tracking-wider hover:bg-aria-maroon hover:text-white transition-all duration-300 transform hover:scale-105"
          >
            Start Designing
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-white py-16 border-t border-aria-lightgray">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-black mb-8 uppercase tracking-tighter">
            Join Arianation Community
          </h2>
          <p className="text-aria-charcoal mb-8 max-w-xl mx-auto">
            Get exclusive drops, early access to new collections, and insider updates delivered to your inbox.
          </p>
          <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-aria-lightgray focus:outline-none focus:border-black transition-colors"
              required
            />
            <button className="px-8 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-aria-maroon transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
