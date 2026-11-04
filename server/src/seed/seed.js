require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const TourPackage = require('../models/TourPackage');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { destinationsData } = require('./seedData');

const futureDates = [
  '2026-11-10',
  '2026-11-20',
  '2026-12-05',
  '2026-12-15',
  '2026-12-24',
  '2027-01-10',
  '2027-01-20',
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelease';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Upsert destinations idempotently
    const destinationMap = {};
    for (const d of destinationsData) {
      const dest = await Destination.findOneAndUpdate(
        { slug: d.slug },
        d,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      destinationMap[d.slug] = dest._id;
    }
    console.log(`[Seed] Seeded ${Object.keys(destinationMap).length} destinations.`);

    // 12 Rich Tour Packages
    const packagesData = [
      {
        title: 'Ooty Nilgiri Tea & Heritage Escape',
        slug: 'ooty-nilgiri-tea-heritage-escape',
        destination: destinationMap['ooty'],
        description: 'Immerse in the emerald tea estates of Nilgiris, take in panoramic vistas from Doddabetta, ride the historic mountain toy train, and relax by the tranquil Pykara lake.',
        durationDays: 4,
        durationNights: 3,
        pricePerTraveler: 14500,
        currency: 'INR',
        capacity: 18,
        averageRating: 4.8,
        reviewCount: 38,
        images: [
          'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['3 Nights stay in premium hill resort', 'Daily buffet breakfast and gourmet dinner', 'Toy Train ticket reservations', 'Private sightseeing cab', 'All toll and parking fees'],
        exclusions: ['Airfare / Railway ticket to Coimbatore', 'Lunch & personal beverages', 'Boating charges at Ooty Lake', 'Camera permits'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Arrival & Ooty Town Ambiance', description: 'Arrive via Coimbatore or Mettupalayam, transfer to resort. Evening stroll around Ooty Lake and local chocolate shops.', meals: 'Dinner included', accommodation: 'Sterling Ooty Fern Hill' },
          { day: 2, title: 'Doddabetta Peak & Tea Factory Visit', description: 'Head to the highest point in Nilgiris at Doddabetta, tour an authentic tea processing factory, and stroll through the Botanical Gardens.', meals: 'Breakfast & Dinner', accommodation: 'Sterling Ooty Fern Hill' },
          { day: 3, title: 'Heritage Toy Train & Coonoor Valley', description: 'Board the UNESCO World Heritage toy train down to Coonoor. Visit Sim’s Park, Dolphin’s Nose, and Lamb’s Rock.', meals: 'Breakfast & Dinner', accommodation: 'Sterling Ooty Fern Hill' },
          { day: 4, title: 'Pykara Waterfalls & Departure', description: 'Visit scenic Pykara lake and falls before concluding your journey with sweet memories and Nilgiri tea souvenirs.', meals: 'Breakfast included', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Nilgiri Toy Train & Mudumalai Forest Safari',
        slug: 'nilgiri-toy-train-mudumalai-safari',
        destination: destinationMap['ooty'],
        description: 'Combine scenic Nilgiri mountain vistas with thrilling wild jungle safaris in Mudumalai Tiger Reserve with chances to spot wild elephants, deer, and leopards.',
        durationDays: 3,
        durationNights: 2,
        pricePerTraveler: 11900,
        currency: 'INR',
        capacity: 16,
        averageRating: 4.7,
        reviewCount: 22,
        images: [
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['2 Nights eco-resort accommodation', 'Daily breakfast & dinner', 'Mudumalai Jungle Jeep Safari', 'Toy train experience', 'Local naturalist guide'],
        exclusions: ['Personal camera fees at sanctuary', 'Lunch and snacks', 'Tips and porterage'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Scenic Transfer & Jungle Check-in', description: 'Arrive at Nilgiri foothills, check in to jungle retreat bordering Mudumalai. Evening campfire and wildlife briefing.', meals: 'Dinner', accommodation: 'Bandipur-Mudumalai Safari Lodge' },
          { day: 2, title: 'Morning Forest Safari & Ooty Highlands', description: 'Early morning safari in Mudumalai sanctuary followed by ascent to Ooty for lake and rose garden sightseeing.', meals: 'Breakfast & Dinner', accommodation: 'Bandipur-Mudumalai Safari Lodge' },
          { day: 3, title: 'Coonoor Sightseeing & Return', description: 'Short visit to tea estates before transfer to Coimbatore airport or railway station.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Manali Snow & Solang Valley Thrills',
        slug: 'manali-snow-solang-adventure-thrills',
        destination: destinationMap['manali'],
        description: 'Experience exhilarating paragliding in Solang Valley, drive through the engineering marvel Atal Tunnel, explore historic Hadimba Temple, and chill in Old Manali vibe.',
        durationDays: 5,
        durationNights: 4,
        pricePerTraveler: 18500,
        currency: 'INR',
        capacity: 20,
        averageRating: 4.9,
        reviewCount: 56,
        images: [
          'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['4 Nights 4-star boutique hotel stay', 'Buffet breakfast & dinner daily', 'Private 4x4 cab for Solang and Atal Tunnel', 'Old Manali heritage walking tour', 'Welcome drinks upon arrival'],
        exclusions: ['Activity equipment charges (paragliding, zorbing, skiing)', 'Rohtang Pass government permit if requested additionally', 'Lunch during daytime'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Arrival in Kullu-Manali Valley', description: 'Scenic drive from Chandigarh/Bhuntar. Check into resort with mountain views. Evening at Mall Road.', meals: 'Dinner', accommodation: 'The Himalayan Resort & Spa' },
          { day: 2, title: 'Local Heritage: Hadimba & Vashisht Hot Springs', description: 'Visit 16th century Hadimba Devi temple, Manu temple, and natural sulphur hot baths at Vashisht.', meals: 'Breakfast & Dinner', accommodation: 'The Himalayan Resort & Spa' },
          { day: 3, title: 'Solang Valley Adventure & Snow Zone', description: 'Action-packed day at Solang Valley. Enjoy snow activities, paragliding, ropeway rides, and Atal Tunnel excursion.', meals: 'Breakfast & Dinner', accommodation: 'The Himalayan Resort & Spa' },
          { day: 4, title: 'Naggar Castle & Old Manali Cafes', description: 'Explore ancient Naggar Castle and Roerich art gallery, followed by craft beer and live music in Old Manali.', meals: 'Breakfast & Dinner', accommodation: 'The Himalayan Resort & Spa' },
          { day: 5, title: 'Departure with Himalayan Memories', description: 'Morning breakfast overlooking snow peaks and transfer towards Chandigarh or Delhi.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Rohtang Pass, Kasol & Parvati Valley Explorer',
        slug: 'rohtang-pass-kasol-parvati-valley',
        destination: destinationMap['manali'],
        description: 'Trek along the emerald Parvati river, sample authentic Israeli cuisine in Kasol, soak in Manikaran hot springs, and conquer Rohtang Pass.',
        durationDays: 6,
        durationNights: 5,
        pricePerTraveler: 22900,
        currency: 'INR',
        capacity: 15,
        averageRating: 4.8,
        reviewCount: 31,
        images: [
          'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['5 Nights stay (3 nights Manali, 2 nights Kasol riverside camp)', 'Daily breakfast & dinner', 'Rohtang Pass excursion permits', 'Chalal village guided trek', 'Private vehicle throughout'],
        exclusions: ['Snow dress rental fees', 'Personal adventure activities', 'Lunches & drinks'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Arrive Manali & Acclimatize', description: 'Check into hotel, explore Tibetan Monastery and enjoy cafe culture.', meals: 'Dinner', accommodation: 'Apple Country Resort' },
          { day: 2, title: 'High Altitude: Rohtang Pass', description: 'Scenic drive up to 13,058 ft at Rohtang Pass. Marvel at glaciers and Chandra river valley.', meals: 'Breakfast & Dinner', accommodation: 'Apple Country Resort' },
          { day: 3, title: 'Solang Adventure & Sissu Valley', description: 'Pass through Atal Tunnel into Lahaul valley to witness the stunning Sissu waterfall.', meals: 'Breakfast & Dinner', accommodation: 'Apple Country Resort' },
          { day: 4, title: 'Transfer to Kasol & Parvati River', description: 'Drive along Parvati river to Kasol. Riverside luxury camp check-in. Evening bonfire.', meals: 'Breakfast & Dinner', accommodation: 'Riverside Glamping Camps' },
          { day: 5, title: 'Manikaran Sahib & Chalal Trail', description: 'Visit Gurudwara Manikaran Sahib hot springs and easy scenic hike to Chalal hamlet.', meals: 'Breakfast & Dinner', accommodation: 'Riverside Glamping Camps' },
          { day: 6, title: 'Departure', description: 'Farewell breakfast and return transfer to Bhuntar airport or Chandigarh.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Goa Coastal Sun, Sands & Sunset Cruise',
        slug: 'goa-coastal-sun-sands-sunset-cruise',
        destination: destinationMap['goa'],
        description: 'Unwind on golden beaches, savor seafood shacks in Calangute, explore 17th-century Fort Aguada, and enjoy a lively Mandovi River sunset music cruise.',
        durationDays: 4,
        durationNights: 3,
        pricePerTraveler: 16999,
        currency: 'INR',
        capacity: 25,
        averageRating: 4.9,
        reviewCount: 64,
        images: [
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['3 Nights 4-star beach resort stay in North Goa', 'Daily buffet breakfast', 'Mandovi river 1-hour sunset cruise ticket', 'Full day North Goa beach tour', 'Airport pickup and drop'],
        exclusions: ['Water sports fees (scuba, jet ski, banana ride)', 'Club entry covers', 'Personal beverages and dinners outside hotel package'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Welcome to Sunny Goa', description: 'Airport pickup and transfer to beach resort. Relax on the beach or poolside with chilled welcome drink.', meals: 'Dinner', accommodation: 'Novotel Goa Candolim' },
          { day: 2, title: 'North Goa Beaches & Fort Aguada', description: 'Explore historic Fort Aguada lighthouse, Sinquerim, Calangute, Baga, and Anjuna viewpoints.', meals: 'Breakfast', accommodation: 'Novotel Goa Candolim' },
          { day: 3, title: 'Old Goa Churches & Mandovi Cruise', description: 'Visit UNESCO Basilica of Bom Jesus, Se Cathedral, followed by sunset music cruise on Mandovi.', meals: 'Breakfast & Dinner', accommodation: 'Novotel Goa Candolim' },
          { day: 4, title: 'Leisure & Departure', description: 'Last minute beach walk, shopping at local flea markets, and transfer to Dabolim/Mopa airport.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'South Goa Heritage Mansions & Spice Plantation',
        slug: 'south-goa-heritage-spice-plantation',
        destination: destinationMap['goa'],
        description: 'Experience the serene, soulful side of South Goa with pristine white-sand beaches, Portuguese mansions in Chandor, organic spice farm buffet, and peaceful sunsets.',
        durationDays: 3,
        durationNights: 2,
        pricePerTraveler: 12500,
        currency: 'INR',
        capacity: 18,
        averageRating: 4.8,
        reviewCount: 29,
        images: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['2 Nights beachfront luxury resort in South Goa', 'Daily breakfast & authentic Goan lunch at Spice Plantation', 'Guided Portuguese heritage walk', 'Private AC car transfers'],
        exclusions: ['Airfare', 'Personal alcoholic drinks', 'Souvenir purchases'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Serene South Goa Check-in', description: 'Check into beach resort in Colva / Benaulim. Enjoy sunset walk on peaceful uncrowded sand.', meals: 'Dinner', accommodation: 'Heritage Village Resort South Goa' },
          { day: 2, title: 'Sahakari Spice Farm & Palolem Beach', description: 'Tour traditional aromatic spice farm with traditional Goan buffet lunch. Sunset at iconic crescent Palolem beach.', meals: 'Breakfast & Traditional Lunch', accommodation: 'Heritage Village Resort South Goa' },
          { day: 3, title: 'Cabo de Rama Fort & Farewell', description: 'Visit clifftop Cabo de Rama fort before departing for the airport.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Royal Jaipur Heritage & Amber Fort Royalty',
        slug: 'royal-jaipur-heritage-amber-fort',
        destination: destinationMap['jaipur'],
        description: 'Step into royal Rajputana splendour: explore Amber Fort, the iconic honeycomb facade of Hawa Mahal, astronomical marvels of Jantar Mantar, and vibrant Johari Bazaar.',
        durationDays: 4,
        durationNights: 3,
        pricePerTraveler: 15400,
        currency: 'INR',
        capacity: 20,
        averageRating: 4.8,
        reviewCount: 43,
        images: [
          'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['3 Nights heritage haveli hotel stay', 'Daily royal Rajasthani breakfast & dinner', 'Monument composite entry tickets', 'Certified English-speaking heritage guide', 'Private AC sedan transportation'],
        exclusions: ['Elephant/jeep ride up to Amber Fort', 'Personal shopping in craft markets', 'Lunch and snacks'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Welcome to the Pink City', description: 'Arrive at Jaipur, check in to heritage palace hotel. Evening visit to Birla Temple and Chokhi Dhani village fair.', meals: 'Dinner', accommodation: 'Alsisar Haveli Jaipur' },
          { day: 2, title: 'Amer Fort, Jal Mahal & Nahargarh', description: 'Explore majestic Amer fort on hilltop, stop at Jal Mahal photo point, and watch sunset over Jaipur from Nahargarh.', meals: 'Breakfast & Dinner', accommodation: 'Alsisar Haveli Jaipur' },
          { day: 3, title: 'City Palace, Hawa Mahal & Bazaars', description: 'Tour City Palace royal museum, Jantar Mantar observatory, and shop for blue pottery & block printed cottons.', meals: 'Breakfast & Dinner', accommodation: 'Alsisar Haveli Jaipur' },
          { day: 4, title: 'Albert Hall & Departure', description: 'Visit Albert Hall Museum before transfer to airport or railway station.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Kerala Serene Backwaters & Munnar Tea Mist',
        slug: 'kerala-serene-backwaters-munnar-luxury',
        destination: destinationMap['kerala'],
        description: 'Cruise emerald palm-fringed backwaters on a private traditional houseboat, breathe fresh mountain mist in Munnar tea hills, and spot Nilgiri Tahr at Eravikulam.',
        durationDays: 6,
        durationNights: 5,
        pricePerTraveler: 26500,
        currency: 'INR',
        capacity: 16,
        averageRating: 4.9,
        reviewCount: 52,
        images: [
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['2 Nights Munnar hill resort + 1 Night Thekkady + 2 Nights Alleppey Deluxe Houseboat', 'All meals on Houseboat (Authentic Kerala Sadhya)', 'Breakfast included at resorts', 'Private AC vehicle throughout', 'Tea museum tour ticket'],
        exclusions: ['Airfare to Kochi', 'Ayurvedic treatments (optional)', 'Kathakali show entry fee'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Cochin to Munnar Hill Station', description: 'Pickup at Kochi airport, drive through Cheeyappara & Valara waterfalls into the misty hills of Munnar.', meals: 'Dinner', accommodation: 'Blanket Hotel & Spa Munnar' },
          { day: 2, title: 'Munnar Tea Gardens & Eravikulam', description: 'Visit Eravikulam National Park, Mattupetty dam, Eco Point, and live tea factory demonstration.', meals: 'Breakfast & Dinner', accommodation: 'Blanket Hotel & Spa Munnar' },
          { day: 3, title: 'Thekkady Spices & Wildlife Sanctuary', description: 'Drive to Thekkady. Spice garden guided walking tour and evening boat ride on Periyar lake.', meals: 'Breakfast & Dinner', accommodation: 'Elephant Court Thekkady' },
          { day: 4, title: 'Board Alleppey Private Houseboat', description: 'Embark on traditional Kettuvallam houseboat. Sail through narrow canals, paddy fields, and village lagoons.', meals: 'Breakfast, Lunch & Dinner', accommodation: 'Lakes & Lagoons Houseboat' },
          { day: 5, title: 'Marari Beach Relaxation', description: 'Disembark houseboat and head to pristine Marari beach resort for soothing coastal relaxation.', meals: 'Breakfast & Dinner', accommodation: 'Marari Beach Resort' },
          { day: 6, title: 'Kochi Sightseeing & Departure', description: 'Visit Fort Kochi Chinese fishing nets and Jew Town before drop-off at Cochin International Airport.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Wayanad Waterfalls & Chembra Peak Trek',
        slug: 'wayanad-waterfalls-chembra-peak',
        destination: destinationMap['kerala'],
        description: 'Discover the lush green wilderness of Wayanad: hike to heart-shaped Chembra lake, visit Edakkal ancient caves, and see Banasura Sagar dam.',
        durationDays: 4,
        durationNights: 3,
        pricePerTraveler: 17800,
        currency: 'INR',
        capacity: 14,
        averageRating: 4.8,
        reviewCount: 20,
        images: [
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['3 Nights treehouse or eco-resort stay', 'Daily breakfast & dinner', 'Guided trek permits', 'Private AC vehicle from Calicut'],
        exclusions: ['Personal adventure gear', 'Lunch meals'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Arrival at Wayanad Highlands', description: 'Scenic drive through Thamarassery Churam ghats. Check in to plantation resort.', meals: 'Dinner', accommodation: 'Vythiri Resort Wayanad' },
          { day: 2, title: 'Chembra Peak & Edakkal Caves', description: 'Morning hike to the famous heart-shaped lake, followed by Neolithic rock engravings at Edakkal.', meals: 'Breakfast & Dinner', accommodation: 'Vythiri Resort Wayanad' },
          { day: 3, title: 'Banasura Sagar Dam & Soochipara Falls', description: 'Visit India’s largest earthen dam and swim in natural pools below Soochipara falls.', meals: 'Breakfast & Dinner', accommodation: 'Vythiri Resort Wayanad' },
          { day: 4, title: 'Tea Plantation Walk & Return', description: 'Morning fresh spice shopping and transfer to Calicut airport/station.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Tropical Bali Rice Terraces & Uluwatu Cliffs',
        slug: 'tropical-bali-rice-terraces-uluwatu',
        destination: destinationMap['bali'],
        description: 'The ultimate Indonesian getaway: Ubud art markets, emerald Tegallalang rice terraces, sacred Tirta Empul springs, Mount Batur, and Uluwatu cliff sunset Kecak dance.',
        durationDays: 7,
        durationNights: 6,
        pricePerTraveler: 48999,
        currency: 'INR',
        capacity: 20,
        averageRating: 4.9,
        reviewCount: 48,
        images: [
          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['3 Nights Ubud Villa with private pool + 3 Nights Seminyak Beach Resort', 'Daily American/Indonesian breakfast', 'Uluwatu Sunset Kecak dance show tickets', 'Full day Ubud & Kintamani tour', 'Airport transfers with English-speaking Balinese driver'],
        exclusions: ['International flight tickets to Denpasar', 'Visa on Arrival fee (~$35 USD)', 'Water sports in Nusa Dua', 'Lunches & dinners'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Arrive in Denpasar & Ubud Transfer', description: 'Welcome flower garland at Ngurah Rai Airport, drive into tropical rainforest retreat in Ubud.', meals: 'Welcome drink', accommodation: 'Kamandalu Ubud Resort' },
          { day: 2, title: 'Ubud Culture: Monkey Forest & Rice Terraces', description: 'Visit sacred monkey forest sanctuary, Tegallalang swing, and coffee plantation.', meals: 'Breakfast', accommodation: 'Kamandalu Ubud Resort' },
          { day: 3, title: 'Kintamani Volcano & Batur Vista', description: 'View Mount Batur volcano and crater lake, visit Tirta Empul holy spring temple.', meals: 'Breakfast', accommodation: 'Kamandalu Ubud Resort' },
          { day: 4, title: 'Transfer to Seminyak & Sunset Shacks', description: 'Move to chic Seminyak. Check in to beachside resort. Sunset chill at Potato Head Beach Club.', meals: 'Breakfast', accommodation: 'W Bali - Seminyak' },
          { day: 5, title: 'Nusa Penida Island Speedboat Day Trip', description: 'Fast boat to Nusa Penida to witness Kelingking T-Rex cliff and Crystal Bay snorkeling.', meals: 'Breakfast & Local Lunch', accommodation: 'W Bali - Seminyak' },
          { day: 6, title: 'Uluwatu Clifftop Temple & Kecak Dance', description: 'Visit dramatic cliffside temple at Uluwatu, witness sunset Kecak fire dance, and seafood dinner at Jimbaran bay.', meals: 'Breakfast', accommodation: 'W Bali - Seminyak' },
          { day: 7, title: 'Last-minute Souvenirs & Departure', description: 'Shop for Balinese handicrafts, spa treatment, and airport drop.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Magical Singapore Highlights & Universal Studios',
        slug: 'magical-singapore-universal-studios',
        destination: destinationMap['singapore'],
        description: 'Explore futuristic Singapore: Gardens by the Bay Cloud Forest & Flower Dome, Marina Bay Sands SkyPark panoramic deck, full day at Universal Studios Sentosa, and Night Safari.',
        durationDays: 5,
        durationNights: 4,
        pricePerTraveler: 54500,
        currency: 'INR',
        capacity: 22,
        averageRating: 4.9,
        reviewCount: 50,
        images: [
          'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['4 Nights 4-star Orchard Road / Bugis hotel stay', 'Daily international buffet breakfast', 'Gardens by the Bay Double Conservatories ticket', 'Marina Bay Sands SkyPark Observation Deck ticket', 'Universal Studios Singapore 1-day pass', 'Airport pick up & drop'],
        exclusions: ['Airfare to Singapore', 'Singapore Tourist Visa fees', 'Express passes for Universal rides', 'Lunches & dinners'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Arrival & Jewel Changi Waterfall', description: 'Arrive at the world’s best airport, explore Jewel Rain Vortex, check in to hotel. Evening at Clarke Quay.', meals: 'Welcome drink', accommodation: 'Grand Pacific Hotel Singapore' },
          { day: 2, title: 'City Highlights & Gardens by the Bay', description: 'Merlion Park, Chinatown, Marina Bay Sands SkyPark, and the dazzling Garden Rhapsody light show.', meals: 'Breakfast', accommodation: 'Grand Pacific Hotel Singapore' },
          { day: 3, title: 'Universal Studios Thrills at Sentosa', description: 'Full day of movie-themed roller coasters and attractions at Universal Studios Sentosa.', meals: 'Breakfast', accommodation: 'Grand Pacific Hotel Singapore' },
          { day: 4, title: 'Singapore Zoo & Night Safari', description: 'Visit Mandai wildlife parks and take the famous tram through the nocturnal animal habitats.', meals: 'Breakfast', accommodation: 'Grand Pacific Hotel Singapore' },
          { day: 5, title: 'Orchard Road Shopping & Departure', description: 'Morning shopping along Orchard Road and flight transfer.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
      {
        title: 'Kashmir Valley Paradise: Dal Lake & Gulmarg',
        slug: 'kashmir-valley-paradise-dal-lake-gulmarg',
        destination: destinationMap['kashmir'],
        description: 'Experience heaven on earth: stay in a handcrafted cedar houseboat on Dal Lake, take a romantic Shikara ride, ride the Gulmarg Gondola over snow peaks, and explore Betaab Valley.',
        durationDays: 6,
        durationNights: 5,
        pricePerTraveler: 28999,
        currency: 'INR',
        capacity: 18,
        averageRating: 4.9,
        reviewCount: 42,
        images: [
          'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1000&q=80',
        ],
        inclusions: ['1 Night Deluxe Dal Lake Houseboat + 2 Nights Gulmarg + 2 Nights Pahalgam', 'Daily breakfast & authentic Kashmiri Wazwan dinner', '1 Hour Shikara ride on Dal Lake', 'Private heated vehicle for all transfers', 'Local English/Hindi speaking tour coordinator'],
        exclusions: ['Gulmarg Gondola Phase 2 tickets (can be pre-booked)', 'Pony rides in Pahalgam or Sonamarg', 'Personal warm jackets rental'],
        departureDates: futureDates,
        itinerary: [
          { day: 1, title: 'Srinagar Arrival & Dal Lake Houseboat', description: 'Srinagar airport pickup, check in to heritage wooden houseboat on Dal Lake. Relaxing sunset Shikara ride with warm Kahwa tea.', meals: 'Dinner', accommodation: 'Mascot Deluxe Houseboat Dal Lake' },
          { day: 2, title: 'Mughal Gardens & Drive to Gulmarg', description: 'Visit Shalimar and Nishat Bagh before driving through pine forests to the alpine meadow of Gulmarg.', meals: 'Breakfast & Dinner', accommodation: 'Khyber Himalayan Resort Gulmarg' },
          { day: 3, title: 'Gulmarg Gondola & Snow Activities', description: 'Board the world’s highest cable car Gondola to Phase 1 and 2 for breathtaking views of Apharwat peak.', meals: 'Breakfast & Dinner', accommodation: 'Khyber Himalayan Resort Gulmarg' },
          { day: 4, title: 'Transfer to Pahalgam (Valley of Shepherds)', description: 'Scenic drive to Pahalgam via saffron fields of Pampore. Evening stroll along the roaring Lidder River.', meals: 'Breakfast & Dinner', accommodation: 'Pine N Peak Pahalgam' },
          { day: 5, title: 'Betaab Valley, Aru & Chandanwari', description: 'Excursion to picturesque Betaab valley, Aru village, and lush pine meadows.', meals: 'Breakfast & Dinner', accommodation: 'Pine N Peak Pahalgam' },
          { day: 6, title: 'Return Transfer to Srinagar Airport', description: 'Final shopping for saffron, walnuts, and pashmina shawls before airport drop.', meals: 'Breakfast', accommodation: 'Check-out' },
        ],
        isPublished: true,
      },
    ];

    for (const p of packagesData) {
      await TourPackage.findOneAndUpdate(
        { slug: p.slug },
        p,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`[Seed] Seeded ${packagesData.length} tour packages.`);

    // Seed Initial Administrator using environment variables
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@travelease.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@TravelEase2026!';
    const adminName = process.env.ADMIN_NAME || 'TravelEase Administrator';

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+91 98765 43210',
      });
      console.log(`[Seed] Created Administrator: ${adminEmail} (Role: admin)`);
    } else {
      adminUser.role = 'admin';
      adminUser.name = adminName;
      adminUser.password = adminPassword;
      await adminUser.save();
      console.log(`[Seed] Updated Administrator credentials for ${adminEmail}`);
    }

    // Seed Sample Demo User
    const demoEmail = 'traveler@travelease.com';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Traveler',
        email: demoEmail,
        password: 'Traveler@2026!',
        role: 'user',
        phone: '+91 91234 56789',
      });
      console.log(`[Seed] Created Demo User: ${demoEmail}`);
    }

    // Sample bookings with verified payment records
    const samplePackage = await TourPackage.findOne({ slug: 'ooty-nilgiri-tea-heritage-escape' });
    if (samplePackage && demoUser) {
      const amount1 = samplePackage.pricePerTraveler * 2;
      const booking1 = await Booking.findOneAndUpdate(
        { bookingReference: 'TE-DEMO01' },
        {
          bookingReference: 'TE-DEMO01',
          user: demoUser._id,
          email: demoUser.email,
          customerName: demoUser.name,
          contactPhone: demoUser.phone,
          package: samplePackage._id,
          packageTitleSnapshot: samplePackage.title,
          destinationSnapshot: 'Ooty',
          departureDate: new Date('2026-11-10'),
          travelerCount: 2,
          pricePerTraveler: samplePackage.pricePerTraveler,
          totalAmount: amount1,
          currency: 'INR',
          status: 'Confirmed',
          paymentStatus: 'paid',
          paymentReference: 'pay_test_ooty_demo01',
        },
        { upsert: true, new: true }
      );

      // Create linked payment record
      await Payment.findOneAndUpdate(
        { booking: booking1._id },
        {
          booking: booking1._id,
          user: demoUser._id,
          provider: 'test_gateway',
          gatewayOrderId: 'order_test_demo01',
          gatewayPaymentId: 'pay_test_ooty_demo01',
          gatewaySignature: 'test_verified_signature_demo01',
          amount: amount1,
          currency: 'INR',
          status: 'paid',
          paymentMethod: 'UPI / NetBanking',
          verifiedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      const amount2 = samplePackage.pricePerTraveler * 3;
      const booking2 = await Booking.findOneAndUpdate(
        { bookingReference: 'TE-DEMO02' },
        {
          bookingReference: 'TE-DEMO02',
          user: demoUser._id,
          email: 'alex.wanderer@gmail.com',
          customerName: 'Alex Wanderer',
          package: samplePackage._id,
          packageTitleSnapshot: samplePackage.title,
          destinationSnapshot: 'Ooty',
          departureDate: new Date('2026-12-05'),
          travelerCount: 3,
          pricePerTraveler: samplePackage.pricePerTraveler,
          totalAmount: amount2,
          currency: 'INR',
          status: 'Confirmed',
          paymentStatus: 'paid',
          paymentReference: 'pay_test_ooty_demo02',
        },
        { upsert: true, new: true }
      );

      await Payment.findOneAndUpdate(
        { booking: booking2._id },
        {
          booking: booking2._id,
          user: demoUser._id,
          provider: 'test_gateway',
          gatewayOrderId: 'order_test_demo02',
          gatewayPaymentId: 'pay_test_ooty_demo02',
          gatewaySignature: 'test_verified_signature_demo02',
          amount: amount2,
          currency: 'INR',
          status: 'paid',
          paymentMethod: 'Credit Card',
          verifiedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log('[Seed] Created verified demo bookings and payments.');
    }

    console.log('[Seed] Database seeding completed successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
