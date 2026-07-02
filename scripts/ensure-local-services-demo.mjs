import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function upsertUser({ name, phone, role, location, bio, isVerified = true }) {
  const existing = await sql`select id from users where phone = ${phone} limit 1`;
  if (existing[0]) {
    const [user] = await sql`
      update users
      set name = ${name}, role = ${role}, location = ${location}, bio = ${bio}, is_verified = ${isVerified}, updated_at = now()
      where id = ${existing[0].id}
      returning *
    `;
    return user;
  }
  const [user] = await sql`
    insert into users (name, phone, role, location, bio, is_verified, loyalty_points, wallet_balance)
    values (${name}, ${phone}, ${role}, ${location}, ${bio}, ${isVerified}, 250, '0.00')
    returning *
  `;
  return user;
}

async function ensureCategory(name, icon) {
  const existing = await sql`select id from service_categories where lower(name) = lower(${name}) limit 1`;
  if (existing[0]) return existing[0];
  const [category] = await sql`insert into service_categories (name, icon) values (${name}, ${icon}) returning *`;
  return category;
}

async function ensureProvider(user, data) {
  const existing = await sql`select id from provider_profiles where user_id = ${user.id} limit 1`;
  if (existing[0]) {
    const [profile] = await sql`
      update provider_profiles
      set business_name = ${data.businessName}, description = ${data.description}, address = ${data.address},
          latitude = ${data.latitude}, longitude = ${data.longitude}, rating = ${data.rating}, review_count = ${data.reviewCount}
      where id = ${existing[0].id}
      returning *
    `;
    return profile;
  }
  const [profile] = await sql`
    insert into provider_profiles (user_id, business_name, description, address, latitude, longitude, rating, review_count)
    values (${user.id}, ${data.businessName}, ${data.description}, ${data.address}, ${data.latitude}, ${data.longitude}, ${data.rating}, ${data.reviewCount})
    returning *
  `;
  return profile;
}

async function ensureService(profile, category, service) {
  const existing = await sql`
    select id from services
    where provider_id = ${profile.id} and lower(name) = lower(${service.name})
    limit 1
  `;
  if (existing[0]) {
    await sql`
      update services
      set category_id = ${category.id}, description = ${service.description}, duration_minutes = ${service.duration},
          price = ${service.price}, is_active = true
      where id = ${existing[0].id}
    `;
    return;
  }
  await sql`
    insert into services (provider_id, category_id, name, description, duration_minutes, price, is_active)
    values (${profile.id}, ${category.id}, ${service.name}, ${service.description}, ${service.duration}, ${service.price}, true)
  `;
}

async function ensureNotification(userId, title, body) {
  const exists = await sql`
    select id from notifications
    where user_id = ${userId} and title = ${title}
    limit 1
  `;
  if (!exists[0]) {
    await sql`
      insert into notifications (user_id, type, title, body, action_url)
      values (${userId}, 'demo', ${title}, ${body}, '/client/discover')
    `;
  }
}

const categories = {
  electrician: await ensureCategory("Electrician", "E"),
  mechanic: await ensureCategory("Mechanic", "M"),
  plumbing: await ensureCategory("Plumbing", "P"),
  cleaning: await ensureCategory("Cleaning", "C"),
  tutoring: await ensureCategory("Tutoring", "T"),
  wellness: await ensureCategory("Wellness", "W"),
};

const merchants = [
  {
    user: {
      name: "Kigali Electricians",
      phone: "+250780000005",
      role: "provider",
      location: "Remera, Kigali",
      bio: "Licensed residential and commercial electrical repair team.",
    },
    profile: {
      businessName: "Kigali Electricians",
      description: "Emergency wiring, lighting, sockets, breaker panels, and appliance power fixes.",
      address: "Remera, Kigali",
      latitude: "-1.9483000",
      longitude: "30.1106000",
      rating: "4.80",
      reviewCount: 86,
    },
    category: categories.electrician,
    services: [
      { name: "Emergency Electrical Repair", description: "Fast diagnosis and repair for power faults.", duration: 90, price: "18000.00" },
      { name: "Lighting Installation", description: "Install indoor or outdoor lighting safely.", duration: 120, price: "25000.00" },
    ],
  },
  {
    user: {
      name: "Nyamirambo Auto",
      phone: "+250780000006",
      role: "provider",
      location: "Nyamirambo, Kigali",
      bio: "Mobile mechanic for diagnostics, oil changes, brakes, and roadside checks.",
    },
    profile: {
      businessName: "Nyamirambo Auto",
      description: "Trusted mechanics for diagnostics, minor repairs, and scheduled car maintenance.",
      address: "Nyamirambo, Kigali",
      latitude: "-1.9822000",
      longitude: "30.0388000",
      rating: "4.70",
      reviewCount: 64,
    },
    category: categories.mechanic,
    services: [
      { name: "Car Diagnostic Visit", description: "On-site scan and mechanical inspection.", duration: 60, price: "15000.00" },
      { name: "Oil Change Service", description: "Oil and filter replacement labor.", duration: 45, price: "12000.00" },
    ],
  },
  {
    user: {
      name: "QuickFix Plumbing",
      phone: "+250780000007",
      role: "provider",
      location: "Kacyiru, Kigali",
      bio: "Reliable plumbing repairs for homes, rentals, and offices.",
    },
    profile: {
      businessName: "QuickFix Plumbing",
      description: "Leaks, blocked drains, tap replacement, water heater checks, and bathroom repairs.",
      address: "Kacyiru, Kigali",
      latitude: "-1.9365000",
      longitude: "30.0789000",
      rating: "4.90",
      reviewCount: 51,
    },
    category: categories.plumbing,
    services: [
      { name: "Leak Repair Visit", description: "Find and repair kitchen, bathroom, or pipe leaks.", duration: 75, price: "16000.00" },
      { name: "Blocked Drain Service", description: "Clear common sink, bathroom, and outdoor blockages.", duration: 90, price: "20000.00" },
    ],
  },
];

for (const merchant of merchants) {
  const user = await upsertUser(merchant.user);
  const profile = await ensureProvider(user, merchant.profile);
  for (const service of merchant.services) {
    await ensureService(profile, merchant.category, service);
  }
  await ensureNotification(user.id, "Welcome to Hafi merchant tools", "Your service profile is ready for bookings and client messages.");
}

const clients = [
  { name: "Zara Glow", phone: "+250780000002", role: "customer", location: "Kigali, Rwanda", bio: "Books trusted services and shops local marketplace deals." },
  { name: "Bella Cosmetics", phone: "+250780000004", role: "customer", location: "Musanze, Rwanda", bio: "Books trusted services and follows local merchants." },
  { name: "Jean Homeowner", phone: "+250780000011", role: "customer", location: "Kigali, Rwanda", bio: "Books home repair and maintenance services." },
  { name: "Aline Driver", phone: "+250780000012", role: "customer", location: "Kigali, Rwanda", bio: "Books auto services and local errands." },
];

for (const client of clients) {
  const user = await upsertUser({ ...client, isVerified: false });
  await ensureNotification(user.id, "Try local services on Hafi", "Book electricians, mechanics, plumbers, salons, and other trusted providers.");
}

console.log("General local-services demo data is ready.");
await sql.end();
