import { Sparkles, Flower, Sun, Leaf, Snowflake } from 'lucide-react';

export const SEASONAL_DETAILS = {
  classic: {
    badge: 'Classic Luxury — Timeless Picks',
    icon: Sparkles,
    symbol: '✦',
    particleType: 'float',
    title: 'Timeless Classics.',
    emphasis: '100% Authentic Pre-loved and Brand-new luxury goods and 18k Gold Jewelries. Money back guaranteed.',
    subtitle: 'Discover our meticulously selected collection of pre-loved designer handbags and exquisite selections of jewelry. Handpicked treasures that define elegance.'
  },
  spring: {
    badge: 'Spring Refresh — New Arrivals',
    icon: Flower,
    symbol: '🌸',
    particleType: 'fall',
    title: 'Spring Blossom Curation.',
    emphasis: 'Celebrate with fresh pastel tones, cherry blossom leather hues, and elegant solid 18k gold fine jewelry.',
    subtitle: 'Indulge in a beautiful renewal with curated luxury pieces designed to capture the fresh energy, light breeze, and gentle growth of spring.'
  },
  summer: {
    badge: 'Summer Edit — Golden Hour Curation',
    icon: Sun,
    symbol: '☀️',
    particleType: 'float',
    title: 'The Golden Hour Curation.',
    emphasis: 'Bask in the radiant warmth of curated terracotta leathers, honey-toned luxury patinas, and shimmering 18k gold heirloom jewelry.',
    subtitle: 'Embrace the high-summer sun with our meticulously handpicked collection of authentic pre-loved designer handbags and radiant accessories that capture the season’s vibrant, sun-kissed energy.'
  },
  autumn: {
    badge: 'Autumn Curation — Warm Crimson',
    icon: Leaf,
    symbol: '🍁',
    particleType: 'fall',
    title: 'Harvest Velvet & Ochre.',
    emphasis: 'Cozy rust textures, deep forest tones, and opulent harvest gold accessories.',
    subtitle: 'Prepare for the crisp breeze with our warm collection of autumn leather goods, mahogany accents, and rich, statement jewelry pieces.'
  },
  winter: {
    badge: 'Winter Edit — Festive Curation',
    icon: Snowflake,
    symbol: '❄️',
    particleType: 'fall',
    title: 'Frosted Sapphire Curation.',
    emphasis: 'Breathtaking icy silver hardware, deep winter sapphire leathers, and brilliant diamond jewelry.',
    subtitle: 'Celebrate the gifting season with luxurious winter-white accessories and exquisite jewelries that glisten like fresh frost.'
  }
};

export const STATIC_PARTICLES = [
  { left: '5%', delay: '0s', duration: '11s', size: '14px' },
  { left: '18%', delay: '4s', duration: '14s', size: '20px' },
  { left: '32%', delay: '2s', duration: '12s', size: '16px' },
  { left: '48%', delay: '6s', duration: '15s', size: '18px' },
  { left: '62%', delay: '1s', duration: '10s', size: '22px' },
  { left: '76%', delay: '5s', duration: '13s', size: '15px' },
  { left: '89%', delay: '3s', duration: '16s', size: '12px' },
  { left: '95%', delay: '7s', duration: '9s', size: '19px' },
];
