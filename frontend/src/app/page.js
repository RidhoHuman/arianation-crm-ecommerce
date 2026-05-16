import Link from 'next/link';

export default function Home() {
  return (
    <div className='flex flex-col w-full'>
      {/* HERO SECTION */}
      <section className='relative w-full h-[85vh] bg-white flex items-center justify-center overflow-hidden'>
        <div 
          className='absolute inset-0 bg-cover bg-center opacity-20'
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80)'
          }}
        ></div>
        <div className='absolute inset-0 bg-white/80'></div>
        <div className='relative z-10 flex flex-col items-center text-center px-4'>
          <h1 className='text-5xl md:text-8xl font-black text-black mb-4 tracking-tighter'>
            Against Modern <br /><span className='text-black'>Football.</span>
          </h1>
          <p className='text-lg md:text-xl text-gray-600 mb-8 font-semibold'>
            Premium Casuals &amp; Supporter Apparel.
          </p>
          <Link href='/products' className='bg-black text-white px-10 py-4 font-semibold uppercase tracking-wide hover:bg-gray-900 transition-colors'>
            Shop Collection
          </Link>
        </div>
      </section>

      {/* BESTSELLERS SECTION */}
      <section className='w-full py-16 bg-white'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6'>
          <h2 className='text-4xl font-black text-black mb-12 uppercase tracking-tight'>Bestsellers</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {[1, 2, 3, 4].map((item) => (
              <Link key={item} href={`/products/${item}`} className='group'>
                <div className='relative bg-gray-100 aspect-square mb-4 hover:bg-gray-200 transition-all overflow-hidden border border-gray-200'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-black font-black text-2xl'>PRODUCT {item}</span>
                  </div>
                  <span className='absolute top-3 right-3 bg-black text-white px-3 py-1 text-xs font-bold uppercase'>New</span>
                </div>
                <h3 className='text-sm font-semibold text-black uppercase tracking-wide mb-2'>Premium Casual Tee</h3>
                <p className='text-black font-bold'>Rp 199.000</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOM SABLON SECTION */}
      <section className='w-full py-16 bg-black text-white'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 text-center'>
          <h2 className='text-4xl font-black mb-6 uppercase tracking-tight'>Custom Sablon Design</h2>
          <p className='text-lg mb-8 max-w-2xl mx-auto leading-relaxed font-light'>
            Create Your Own Statement. From club colors to personal designs, our custom sablon service brings your vision to life on premium apparel.
          </p>
          <Link href='/sablon' className='inline-block bg-white text-black px-10 py-4 font-semibold uppercase tracking-wide hover:bg-gray-100 transition-colors'>
            Start Your Design
          </Link>
        </div>
      </section>
    </div>
  );
}
