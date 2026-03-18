import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

function mapService(s: Record<string, unknown>) {
  return {
    id: s.id, ownerId: s.owner_id,
    name: s.name, description: s.description,
    price: parseFloat(s.price as string),
    duration: s.duration, category: s.category,
    imageUrl: s.image_url, isActive: s.is_active,
    createdAt: s.created_at,
  };
}

// ── GET /api/services/templates ───────────────────────────────────────────────
// Returns all global service templates. Creates and seeds the table on first call.
// ── Service templates organised by tier (Economy → Premium Economy → First Class)
// Economy:        KES 300–1,000   (basic wash add-ons welcome)
// Premium Economy: KES 1,050–2,000 (wash + wax, interior polish, glass clean)
// First Class:    KES 2,050+      (full detail, coatings, mechanical checks)
const SEED_TEMPLATES = [
  // ── Economy ──────────────────────────────────────────────────────────────────
  { name: 'Basic Foam Wash',          description: 'Full-body foam application and rinse.',                         price: 300,   duration: 20, category: 'Economy' },
  { name: 'Pressure Rinse',           description: 'High-pressure water rinse to remove loose dirt.',               price: 350,   duration: 15, category: 'Economy' },
  { name: 'Tire Wash',                description: 'Scrub and rinse of all four tires.',                            price: 400,   duration: 20, category: 'Economy' },
  { name: 'Rim Clean',                description: 'Brake dust and grime removal from wheel rims.',                 price: 400,   duration: 20, category: 'Economy' },
  { name: 'Hand Dry',                 description: 'Microfiber hand dry of the full exterior after wash.',          price: 350,   duration: 15, category: 'Economy' },
  { name: 'Light Interior Wipe',      description: 'Quick wipe of dashboard and door panels.',                      price: 400,   duration: 20, category: 'Economy' },
  { name: 'Dashboard Dust Removal',   description: 'Dusting of dashboard, vents, and console surfaces.',            price: 350,   duration: 15, category: 'Economy' },
  { name: 'Floor Mat Shake',          description: 'Remove and shake out all floor mats.',                          price: 300,   duration: 10, category: 'Economy' },
  // Economy add-ons
  { name: 'Tire Shine',               description: 'Dressing applied to tires for a clean glossy finish.',          price: 200,   duration: 10, category: 'Economy' },
  { name: 'Air Freshener',            description: 'Long-lasting cabin air freshener installed.',                    price: 150,   duration:  5, category: 'Economy' },
  { name: 'Quick Vacuum',             description: 'Rapid vacuum of front and rear floor carpets.',                  price: 300,   duration: 15, category: 'Economy' },

  // ── Premium Economy ───────────────────────────────────────────────────────────
  { name: 'Foam Wash + Wax',          description: 'Full foam wash followed by a protective carnauba wax coat.',    price: 1200,  duration: 60, category: 'Premium Economy' },
  { name: 'Tire Shine + Rim Polish',  description: 'Tire dressing plus machine polish of alloy rims.',              price: 1100,  duration: 45, category: 'Premium Economy' },
  { name: 'Door Jamb Cleaning',       description: 'Deep clean of door jambs and hinges.',                          price: 1050,  duration: 30, category: 'Premium Economy' },
  { name: 'Full Vacuum',              description: 'Thorough vacuum of seats, carpets, boot, and all crevices.',    price: 1100,  duration: 40, category: 'Premium Economy' },
  { name: 'Dashboard Polish',         description: 'Clean and UV-protective polish on dashboard and trim.',         price: 1200,  duration: 35, category: 'Premium Economy' },
  { name: 'Window Cleaning',          description: 'Streak-free clean of all interior and exterior glass.',         price: 1050,  duration: 30, category: 'Premium Economy' },
  { name: 'Seat Wipe / Leather Wipe', description: 'Wipe-down and condition of fabric or leather seating surfaces.', price: 1500, duration: 45, category: 'Premium Economy' },
  { name: 'Interior Fragrance',       description: 'Premium cabin fragrance treatment for a lasting fresh scent.',  price: 1100,  duration: 15, category: 'Premium Economy' },

  // ── First Class ───────────────────────────────────────────────────────────────
  { name: 'Full Interior Detailing',  description: 'Complete interior deep clean: seats, carpets, dashboard, vents, boot, and door panels.', price: 3500, duration: 150, category: 'First Class' },
  { name: 'Engine Bay Cleaning',      description: 'Safe degreasing and pressure rinse of the full engine bay.',   price: 2500,  duration: 60, category: 'First Class' },
  { name: 'Ceramic Coating',          description: 'Long-lasting nano-ceramic paint protection layer with 1-year warranty.', price: 15000, duration: 300, category: 'First Class' },
  { name: 'Paint Correction',         description: 'Multi-stage machine polish to remove swirls, scratches, and oxidation.', price: 8000, duration: 240, category: 'First Class' },
  { name: 'Headlight Restoration',    description: 'Polish and UV-seal dull or yellowed headlight lenses.',        price: 2500,  duration: 60, category: 'First Class' },
  { name: 'Oil Change',               description: 'Engine oil and filter replacement using manufacturer-spec oil.', price: 3000, duration: 45, category: 'First Class' },
  { name: 'Brake Inspection',         description: 'Visual and functional check of brake pads, discs, and fluid level.', price: 2500, duration: 40, category: 'First Class' },
  { name: 'Tire Rotation',            description: 'Rotate all four tires to even out tread wear.',                 price: 2500,  duration: 40, category: 'First Class' },
  { name: 'Paint Protection Film',    description: 'Self-healing PPF applied to high-impact panels (bonnet, fenders, mirrors).', price: 20000, duration: 360, category: 'First Class' },
  { name: 'Upholstery Shampoo',       description: 'Deep-shampoo clean of fabric seats and floor carpets.',        price: 3500,  duration: 90, category: 'First Class' },
  { name: 'Odor Removal',             description: 'Ozone or steam treatment to permanently neutralise cabin odours.', price: 2500, duration: 60, category: 'First Class' },
  { name: 'Full Detail',              description: 'Comprehensive interior and exterior detailing — the works.',    price: 5000,  duration: 180, category: 'First Class' },
];

async function handleTemplates(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Lazy-create the table
  await sql`
    CREATE TABLE IF NOT EXISTS service_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      default_price NUMERIC(10,2) NOT NULL,
      default_duration INTEGER NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed if empty
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM service_templates` as [{ count: number }];
  if (count === 0) {
    for (const t of SEED_TEMPLATES) {
      await sql`
        INSERT INTO service_templates (name, description, default_price, default_duration, category)
        VALUES (${t.name}, ${t.description}, ${t.price}, ${t.duration}, ${t.category})
      `;
    }
  }

  const templates = await sql`SELECT * FROM service_templates ORDER BY category, default_price`;
  return res.status(200).json(templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    defaultPrice: parseFloat(t.default_price as string),
    defaultDuration: t.default_duration,
    category: t.category,
  })));
}

// ── GET/POST /api/services ────────────────────────────────────────────────────
async function handleIndex(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { ownerId: ownerIdParam, locationId, activeOnly } = req.query;
    const onlyActive = activeOnly !== 'false';
    let services;

    if (locationId) {
      // Customer view: services for a specific location (joined via owner_id)
      // Only return active services and active locations
      if (onlyActive) {
        services = await sql`
          SELECT s.* FROM services s
          INNER JOIN locations l ON l.owner_id = s.owner_id
          WHERE l.id = ${locationId as string}
            AND l.is_active = true
            AND s.is_active = true
          ORDER BY s.category, s.price
        `;
      } else {
        services = await sql`
          SELECT s.* FROM services s
          INNER JOIN locations l ON l.owner_id = s.owner_id
          WHERE l.id = ${locationId as string}
          ORDER BY s.category, s.price
        `;
      }
    } else if (ownerIdParam) {
      // Owner dashboard: all services for a specific owner (active + inactive)
      services = await sql`
        SELECT * FROM services
        WHERE owner_id = ${ownerIdParam as string}
        ORDER BY category, price
      `;
    } else {
      // Public listing: only active services
      services = await sql`
        SELECT * FROM services WHERE is_active = true ORDER BY category, price
      `;
    }
    return res.status(200).json(services.map(mapService));
  }

  if (req.method === 'POST') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (!['owner', 'admin'].includes(auth.role)) return res.status(403).json({ error: 'Only owners can create services' });
    const ownerId = auth.role === 'admin' ? (req.body.ownerId || auth.userId) : auth.userId;

    // Clone from a template
    const { templateId } = req.body;
    if (templateId) {
      const [template] = await sql`SELECT * FROM service_templates WHERE id = ${templateId}`;
      if (!template) return res.status(404).json({ error: 'Template not found' });
      // Check if the owner already has a service with this name (avoid duplicates)
      const [existing] = await sql`
        SELECT id FROM services WHERE owner_id = ${ownerId} AND LOWER(name) = LOWER(${template.name as string})
      `;
      if (existing) return res.status(409).json({ error: 'You already have a service with this name.' });
      const [service] = await sql`
        INSERT INTO services (owner_id, name, description, price, duration, category, is_active)
        VALUES (${ownerId}, ${template.name}, ${template.description}, ${template.default_price}, ${template.default_duration}, ${template.category}, true)
        RETURNING *
      `;
      return res.status(201).json(mapService(service));
    }

    const { name, description, price, duration, category, imageUrl } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ error: 'Name, price, and duration are required' });
    const [service] = await sql`
      INSERT INTO services (owner_id, name, description, price, duration, category, image_url, is_active)
      VALUES (${ownerId}, ${name}, ${description || null}, ${price}, ${duration}, ${category || 'Basic'}, ${imageUrl || null}, true)
      RETURNING *
    `;
    return res.status(201).json(mapService(service));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── GET/PATCH/PUT/DELETE /api/services/:id ───────────────────────────────────
async function handleById(req: VercelRequest, res: VercelResponse, id: string) {
  if (req.method === 'GET') {
    const [service] = await sql`SELECT * FROM services WHERE id = ${id}`;
    if (!service) return res.status(404).json({ error: 'Service not found' });
    return res.status(200).json({ id: service.id, ownerId: service.owner_id, name: service.name, description: service.description, price: parseFloat(service.price), duration: service.duration, category: service.category, imageUrl: service.image_url, isActive: service.is_active, createdAt: service.created_at });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;
  const [service] = await sql`SELECT owner_id FROM services WHERE id = ${id}`;
  if (!service) return res.status(404).json({ error: 'Service not found' });
  if (auth.role !== 'admin' && service.owner_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { name, description, price, duration, category, imageUrl, isActive } = req.body;
    const [updated] = await sql`
      UPDATE services SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        price = COALESCE(${price || null}, price),
        duration = COALESCE(${duration || null}, duration),
        category = COALESCE(${category || null}, category),
        image_url = COALESCE(${imageUrl || null}, image_url),
        is_active = COALESCE(${isActive ?? null}, is_active)
      WHERE id = ${id} RETURNING *
    `;
    return res.status(200).json({ id: updated.id, ownerId: updated.owner_id, name: updated.name, description: updated.description, price: parseFloat(updated.price), duration: updated.duration, category: updated.category, imageUrl: updated.image_url, isActive: updated.is_active });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM services WHERE id = ${id}`;
    return res.status(200).json({ message: 'Service deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');
  if (slug.length === 0 || route === 'index') return handleIndex(req, res);
  if (route === 'templates') return handleTemplates(req, res);
  if (slug.length === 1) return handleById(req, res, slug[0]);
  return res.status(404).json({ error: 'Not found' });
}
