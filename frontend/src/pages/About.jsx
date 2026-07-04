import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Globe, Users, Award } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import useCategoryStore from '../store/categoryStore';
import useUIStore from '../store/uiStore';

const getTranslatedCategoryName = (name, lang) => {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lang === 'ID') {
    if (lower.includes('everyday')) return 'Sehari-hari';
    if (lower.includes('heritage')) return 'Klasik (Heritage)';
    if (lower.includes('outdoor')) return 'Luar Ruang';
    if (lower.includes('street')) return 'Jalanan';
    if (lower.includes('active')) return 'Aktif';
  } else {
    if (lower.includes('everyday')) return 'Everyday';
    if (lower.includes('heritage')) return 'Heritage';
    if (lower.includes('outdoor')) return 'Outdoor';
    if (lower.includes('street')) return 'Street';
    if (lower.includes('active')) return 'Active';
  }
  return name;
};

export default function About() {
  const language = useUIStore((s) => s.language) || 'ID';
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const activeCategories = categories.filter(c => c.isActive && c.businessType === 'FASHION_RETAIL');

  return (
    <>
      <SEOHead
        title="About Arianation - Indonesian Lifestyle Brand"
        description="Discover the story of Arianation: a versatile lifestyle brand rooted in authentic Indonesian culture, supporter passion, and quality craftsmanship."
        url="https://arianation-crm-ecommerce.vercel.app/about"
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-aria-charcoal text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Arianation
            </h1>
            <p className="text-xl md:text-2xl text-aria-cream font-light">
              {language === 'EN'
                ? 'From Malang. For Indonesia. Celebrating Authenticity Through Versatile Lifestyle.'
                : 'Dari Malang. Untuk Indonesia. Merayakan Otentisitas Melalui Gaya Hidup Serbaguna.'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Story Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-aria-charcoal">
              {language === 'EN' ? 'Our Story' : 'Cerita Kami'}
            </h2>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                <p>
                  {language === 'EN'
                    ? 'Arianation started in Malang in 2010 when our father decided to celebrate supporter culture through custom t-shirt printing. What began as a simple passion for football culture evolved into something much more than just merchandise.'
                    : 'Arianation dimulai di Malang pada tahun 2010 ketika ayah kami memutuskan untuk merayakan supporter culture melalui sablon kaos. Apa yang dimulai sebagai passion sederhana untuk football culture berkembang menjadi lebih dari sekadar produk.'}
                </p>
                <p>
                  {language === 'EN'
                    ? 'Over the years, Arianation has been part of the Indonesian supporter journey, witnessing moments of pride and challenges. We learned that a brand is not just about products—it’s about stories, community, and identity.'
                    : 'Selama bertahun-tahun, Arianation telah menjadi bagian dari perjalanan supporter Indonesia, menyaksikan momen-momen kebanggaan dan tantangan. Kami belajar bahwa brand bukan hanya tentang produk—ini tentang cerita, komunitas, dan identitas.'}
                </p>
                <p>
                  {language === 'EN'
                    ? 'In 2026, we start a new chapter. Not to abandon our roots, but to celebrate them while growing into something broader. We reposition Arianation as a versatile, authentic lifestyle brand rooted in true Indonesian passion.'
                    : 'Pada tahun 2026, kami memulai chapter baru. Bukan untuk meninggalkan akar kami, tetapi untuk merayakan mereka sambil berkembang ke sesuatu yang lebih luas. Kami memposisikan ulang Arianation sebagai lifestyle brand yang versatile, authentic, dan berakar dalam passion Indonesia yang sejati.'}
                </p>
              </div>
              <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Arianation Screen Printing Workshop"
                  className="w-full h-full object-cover grayscale-[20%]"
                />
              </div>
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="mb-20 bg-aria-cream px-8 py-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-8 text-aria-charcoal">
              {language === 'EN' ? 'Our Philosophy' : 'Filosofi Kami'}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Target className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    Versatility Over Category
                  </h3>
                  <p className="text-gray-700">
                    {language === 'EN'
                      ? 'One piece, many uses. Arianation t-shirts can be worn for watching football, hiking, working, or casual hangouts. Like Stone Island, we believe in timeless quality and design for various contexts.'
                      : 'Satu piece, banyak kegunaan. T-shirt Arianation bisa untuk nonton bola, naik gunung, kerja, atau hang out casual. Seperti Stone Island, kami percaya pada kualitas dan desain yang timeless untuk berbagai konteks.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Globe className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    Authentic Storytelling
                  </h3>
                  <p className="text-gray-700">
                    {language === 'EN'
                      ? 'Every product has a story. From supporter passion, local artists, to regional culture across Indonesia. We don’t erase our supporter roots—we celebrate them as an authentic part of Indonesian identity.'
                      : 'Setiap produk punya cerita. Dari supporter passion, local artists, sampai regional culture di seluruh Indonesia. Kami tidak menghilangkan akar supporter kami—kami merayakannya sebagai bagian otentik dari identitas Indonesia.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Users className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    Community First
                  </h3>
                  <p className="text-gray-700">
                    {language === 'EN'
                      ? 'It’s not about maximum profit, but building community. Limited drops, transparent pricing, meaningful collaborations—all to celebrate passion and culture together.'
                      : 'Bukan tentang profit maksimal, tapi tentang membangun komunitas. Limited drops, harga transparan, kolaborasi bermakna—semuanya untuk merayakan passion dan budaya bersama-sama.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Award className="w-6 h-6 text-aria-charcoal" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-aria-charcoal mb-2">
                    Quality & Craftsmanship
                  </h3>
                  <p className="text-gray-700">
                    {language === 'EN'
                      ? 'Materials that respect durability across activities. Thoughtful design. Ethical production. We believe in quality that speaks for itself.'
                      : 'Material yang tangguh untuk berbagai kegiatan. Desain yang penuh pertimbangan. Produksi yang etis. Kami percaya pada kualitas yang berbicara dengan sendirinya.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Collections Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-aria-charcoal">
              {language === 'EN' ? 'Our Collections' : 'Koleksi Kami'}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-6">
              {activeCategories.length > 0 ? activeCategories.map((col, index) => {
                // Fallback images in case the category doesn't have an image
                const fallbackImgs = [
                  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                ];
                const imgSource = col.imageUrl || fallbackImgs[index % fallbackImgs.length];

                return (
                  <div key={col.id} className="relative group overflow-hidden rounded-lg aspect-[4/3] sm:aspect-[4/5] bg-gray-200">
                    <img
                      src={imgSource}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={getTranslatedCategoryName(col.categoryName, language)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:bg-black/40 transition-colors duration-300"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                      <h3 className="text-2xl font-bold mb-2 uppercase tracking-wide">
                        {getTranslatedCategoryName(col.categoryName, language)}
                      </h3>
                      <p className="text-gray-200 mb-4 line-clamp-2 text-sm md:text-base font-light">
                        {col.description || (language === 'EN' ? 'Explore this premium collection.' : 'Jelajahi koleksi premium ini.')}
                      </p>
                      <Link
                        to={`/categories/${col.slug || col.id}`}
                        className="inline-block text-white font-semibold uppercase tracking-wider text-sm hover:underline"
                      >
                        {language === 'EN' ? 'Explore Collection →' : 'Jelajahi Koleksi →'}
                      </Link>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-gray-500 italic col-span-2 text-center py-8">
                  {language === 'EN' ? 'Loading collections...' : 'Memuat koleksi...'}
                </p>
              )}
            </div>
          </section>

          {/* Vision Section */}
          <section className="mb-20 relative overflow-hidden rounded-lg">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1518063009955-46f3630f40d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                alt="Community Vision"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/80"></div>

            {/* Content */}
            <div className="relative z-10 px-8 py-16 md:py-24 max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl font-bold mb-8 uppercase tracking-widest">
                {language === 'EN' ? 'Our Vision' : 'Visi Kami'}
              </h2>
              <div className="space-y-6 text-lg md:text-xl font-light text-gray-200">
                <p>
                  {language === 'EN'
                    ? 'We want Arianation to be known from Sabang to Merauke as a lifestyle brand that celebrates authentic Indonesian passion and culture.'
                    : 'Kami ingin Arianation dikenal dari Sabang sampai Merauke sebagai lifestyle brand yang merayakan passion dan kultur Indonesia secara otentik.'}
                </p>
                <p>
                  {language === 'EN'
                    ? 'Not a brand that copies trends, but a brand that sets trends through authenticity, quality, and community.'
                    : 'Bukan brand yang mengekor tren, tapi brand yang menciptakan tren melalui keaslian, kualitas, dan komunitas.'}
                </p>
                <p>
                  {language === 'EN'
                    ? 'We are building a movement to recognize that Indonesian culture—from supporter passion, local artists, to regional tribes—deserves to be celebrated with respect and quality.'
                    : 'Kami membangun pergerakan untuk menyadari bahwa budaya Indonesia—mulai dari supporter passion, local artists, sampai budaya kedaerahan—layak untuk dirayakan dengan hormat dan kualitas tinggi.'}
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-aria-charcoal">
              {language === 'EN' ? 'Join the Movement' : 'Bergabung Bersama Kami'}
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              {language === 'EN'
                ? 'Arianation is more than a brand. It\'s a celebration of authentic Indonesian lifestyle, passion, and culture. Be part of our journey.'
                : 'Arianation lebih dari sekadar brand. Ini adalah selebrasi gaya hidup, passion, dan budaya Indonesia. Jadilah bagian dari perjalanan kami.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-aria-charcoal text-white px-8 py-3 rounded-lg font-semibold hover:bg-aria-maroon transition"
              >
                {language === 'EN' ? 'Shop Collection' : 'Belanja Koleksi'}
              </Link>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-aria-charcoal text-aria-charcoal px-8 py-3 rounded-lg font-semibold hover:bg-aria-cream transition"
              >
                {language === 'EN' ? 'Follow Us' : 'Ikuti Kami'}
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
