import { Geist, Geist_Mono } from 'next/font/google';
import Image from 'next/image';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = { title: 'ARIANATION | CASUALS & HOOLIGANS', description: 'Premium merchandise and custom sablon.' };

export default function RootLayout({ children }) {
  return (
    <html lang='id' className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body className='antialiased bg-white'>
        <header className='bg-white text-black sticky top-0 z-50 border-b border-gray-200'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between'>
            {/* Logo */}
            <a href='/' className='flex items-center hover:opacity-70 transition-opacity'>
              <Image 
                src='/logo AriaNation.svg' 
                alt='Arianation Logo' 
                width={40} 
                height={40}
                priority
                className='w-10 h-10'
              />
            </a>
            
            <nav className='hidden md:flex gap-8 text-xs font-semibold tracking-wide uppercase'>
              <a href='/' className='text-black hover:text-gray-600 transition-colors'>Shop</a>
              <a href='/products' className='text-black hover:text-gray-600 transition-colors'>Collection</a>
              <a href='/sablon' className='text-black hover:text-gray-600 transition-colors'>Custom Sablon</a>
            </nav>
            <div className='flex gap-6 text-xs font-semibold tracking-wide uppercase items-center'>
              <a href='/login' className='text-black hover:text-gray-600 transition-colors'>Login</a>
              <a href='/checkout' className='text-black hover:text-gray-600 transition-colors text-xl'>🛒</a>
            </div>
          </div>
        </header>
        <main className='flex-grow w-full'>
          {children}
        </main>
        <footer className='bg-white text-black border-t border-gray-200 py-12'>
          <div className='max-w-[1440px] mx-auto px-4 sm:px-6 text-center'>
            <p className='text-xs tracking-wide'>&copy; {new Date().getFullYear()} ARIANATION. ALL RIGHTS RESERVED.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
