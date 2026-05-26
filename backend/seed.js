require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');
const Category = require('./models/Category');
const Venue = require('./models/Venue');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await Booking.deleteMany({});
  await Event.deleteMany({});
  await User.deleteMany({});
  await Category.deleteMany({});
  await Venue.deleteMany({});
  console.log('Collections cleared');

  // ── Categories ─────────────────────────────────────────────────
  const categories = await Category.insertMany([
    { name: 'Music',      icon: '🎵', description: 'Live music concerts and performances' },
    { name: 'Sports',     icon: '⚽', description: 'Sporting events and competitions' },
    { name: 'Conference', icon: '💼', description: 'Professional conferences and seminars' },
    { name: 'Theater',    icon: '🎭', description: 'Theater plays and stage performances' },
    { name: 'Festival',   icon: '🎪', description: 'Cultural festivals and outdoor events' },
    { name: 'Comedy',     icon: '😂', description: 'Stand-up comedy shows and open mics' },
  ]);
  console.log('Categories created:', categories.map(c => c.name).join(', '));
  const [music, sports, conference, theater, festival, comedy] = categories;

  // ── Venues ─────────────────────────────────────────────────────
  const venues = await Venue.insertMany([
    {
      name: 'Brisbane Entertainment Centre',
      address: 'Melaleuca Drive',
      city: 'Boondall',
      country: 'Australia',
      capacity: 13500,
      description: 'Multi-purpose indoor entertainment venue, home to major concerts and sporting events.',
      facilities: ['Parking', 'Wheelchair Access', 'Food & Beverage', 'ATM'],
    },
    {
      name: 'Suncorp Stadium',
      address: '40 Lang Park',
      city: 'Milton',
      country: 'Australia',
      capacity: 52500,
      description: 'Iconic rectangular stadium in Brisbane, hosting football and large-scale events.',
      facilities: ['Parking', 'Wheelchair Access', 'Food & Beverage', 'VIP Suites'],
    },
    {
      name: 'Brisbane Convention & Exhibition Centre',
      address: 'Merivale Street',
      city: 'South Brisbane',
      country: 'Australia',
      capacity: 5000,
      description: 'Premier conference and events destination in the heart of South Bank.',
      facilities: ['Parking', 'Wheelchair Access', 'Catering', 'AV Equipment', 'WiFi'],
    },
    {
      name: 'Queensland Performing Arts Centre',
      address: 'Grey Street, South Bank',
      city: 'South Brisbane',
      country: 'Australia',
      capacity: 2000,
      description: 'World-class performing arts complex presenting the best in theatre, dance, and music.',
      facilities: ['Wheelchair Access', 'Cloakroom', 'Bar', 'Restaurant'],
    },
    {
      name: 'South Bank Parklands',
      address: 'Grey Street',
      city: 'South Brisbane',
      country: 'Australia',
      capacity: 10000,
      description: 'Beautiful riverside parkland venue ideal for outdoor festivals and community events.',
      facilities: ['Food Stalls', 'Picnic Areas', 'Wheelchair Access', 'Public Transport'],
    },
    {
      name: 'The Tivoli',
      address: '52 Costin Street',
      city: 'Fortitude Valley',
      country: 'Australia',
      capacity: 1400,
      description: 'Legendary live music and entertainment venue in the heart of Brisbane\'s entertainment precinct.',
      facilities: ['Bar', 'Wheelchair Access', 'Coat Check', 'ATM'],
    },
  ]);
  console.log('Venues created:', venues.map(v => v.name).join(', '));
  const [bec, suncorp, bcec, qpac, southbank, tivoli] = venues;

  // ── Users ──────────────────────────────────────────────────────
  const adminUser = new User({ name: 'Admin User', email: 'admin@tickets.com', password: 'admin123', role: 'admin' });
  await adminUser.save();
  const regularUser = new User({ name: 'John Doe', email: 'john@example.com', password: 'user123' });
  await regularUser.save();
  console.log('Users created: admin@tickets.com, john@example.com');

  // ── Events ─────────────────────────────────────────────────────
  const events = await Event.insertMany([
    {
      title: 'Summer Music Spectacular',
      description: 'An unforgettable night of live music featuring top artists from around the world. Enjoy multiple stages, food vendors, and an electric atmosphere under the stars.',
      category: music._id,
      createdBy: adminUser._id,
      date: new Date('2026-07-15T19:00:00'),
      endDate: new Date('2026-07-15T23:00:00'),
      venue: bec._id,
      capacity: 200,
      status: 'published',
      bannerImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      ticketTiers: [
        { name: 'General Admission', price: 49.99, quantity: 150, sold: 0 },
        { name: 'VIP',               price: 149.99, quantity: 50,  sold: 0 },
      ],
    },
    {
      title: 'State of Origin Football Gala',
      description: 'Witness the ultimate rugby league rivalry in a premium fan experience event. Watch the big game on giant screens with fellow fans, live commentary and special guest appearances.',
      category: sports._id,
      createdBy: adminUser._id,
      date: new Date('2026-06-10T18:00:00'),
      endDate: new Date('2026-06-10T22:00:00'),
      venue: suncorp._id,
      capacity: 200,
      status: 'published',
      bannerImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
      ticketTiers: [
        { name: 'General Admission', price: 35.00, quantity: 150, sold: 0 },
        { name: 'VIP Lounge',        price: 120.00, quantity: 50,  sold: 0 },
      ],
    },
    {
      title: 'Tech Leaders Summit 2026',
      description: 'Join industry pioneers and innovators at the premier technology conference of the year. Featuring keynotes, workshops, networking sessions, and hands-on product demos.',
      category: conference._id,
      createdBy: adminUser._id,
      date: new Date('2026-08-20T09:00:00'),
      endDate: new Date('2026-08-21T17:00:00'),
      venue: bcec._id,
      capacity: 200,
      status: 'published',
      bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      ticketTiers: [
        { name: 'General Pass',    price: 299.00, quantity: 150, sold: 0 },
        { name: 'VIP All-Access',  price: 799.00, quantity: 50,  sold: 0 },
      ],
    },
    {
      title: "A Midsummer Night's Dream",
      description: "Shakespeare's beloved romantic comedy comes to life in a spectacular outdoor production. Featuring world-class actors, stunning costumes, and magical set design.",
      category: theater._id,
      createdBy: adminUser._id,
      date: new Date('2026-09-05T19:30:00'),
      endDate: new Date('2026-09-05T22:00:00'),
      venue: qpac._id,
      capacity: 200,
      status: 'published',
      bannerImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800',
      ticketTiers: [
        { name: 'Standard Seating', price: 65.00, quantity: 150, sold: 0 },
        { name: 'Premium Seating',  price: 120.00, quantity: 50,  sold: 0 },
      ],
    },
    {
      title: 'Brisbane Food & Culture Festival',
      description: "A weekend celebration of Brisbane's diverse food scene and cultural heritage. Over 100 vendors, cooking demonstrations, live entertainment, and family-friendly activities.",
      category: festival._id,
      createdBy: adminUser._id,
      date: new Date('2026-10-12T10:00:00'),
      endDate: new Date('2026-10-13T20:00:00'),
      venue: southbank._id,
      capacity: 200,
      status: 'published',
      bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      ticketTiers: [
        { name: 'Day Pass',     price: 25.00, quantity: 150, sold: 0 },
        { name: 'Weekend Pass', price: 45.00, quantity: 50,  sold: 0 },
      ],
    },
    {
      title: 'Laugh Out Loud Comedy Night',
      description: "A hilarious evening with some of Australia's top stand-up comedians. Expect non-stop laughs, surprise guest acts, and a night you'll be talking about for years.",
      category: comedy._id,
      createdBy: adminUser._id,
      date: new Date('2026-11-07T20:00:00'),
      endDate: new Date('2026-11-07T23:00:00'),
      venue: tivoli._id,
      capacity: 200,
      status: 'published',
      bannerImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
      ticketTiers: [
        { name: 'General Admission', price: 40.00, quantity: 150, sold: 0 },
        { name: 'VIP Front Row',     price: 95.00, quantity: 50,  sold: 0 },
      ],
    },
  ]);
  console.log('Events created:', events.map(e => e.title).join(', '));
  console.log('\n✅ Database seeded successfully!');
  console.log('   Admin: admin@tickets.com / admin123');
  console.log('   User:  john@example.com  / user123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
