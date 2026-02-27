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
const SEED_TEMPLATES = [
  // Exterior Wash
  { name: 'Exterior Rinse & Wash',    description: 'Basic soap wash and rinse of the full exterior.', price: 300,   duration: 20, category: 'Exterior Wash' },
  { name: 'Express Exterior Wash',    description: 'Quick hand wash with microfiber dry.',              price: 500,   duration: 30, category: 'Exterior Wash' },
  { name: 'Hand Wash & Shine',        description: 'Thorough hand wash, wheel rinse, and microfiber dry.', price: 700, duration: 40, category: 'Exterior Wash' },
  { name: 'Undercarriage Wash',       description: 'High-pressure rinse of the undercarriage to remove mud and debris.', price: 500, duration: 20, category: 'Exterior Wash' },
  // Interior Clean
  { name: 'Interior Vacuum',          description: 'Full interior vacuum including seats, floor mats, and boot.', price: 400, duration: 30, category: 'Interior Clean' },
  { name: 'Interior Wipe Down',       description: 'Dashboard, door panels, and surface wipe with vacuum.', price: 600, duration: 45, category: 'Interior Clean' },
  { name: 'Interior Deep Clean',      description: 'Complete interior clean: seats, carpets, dashboard, vents, and boot.', price: 1500, duration: 90, category: 'Interior Clean' },
  { name: 'Odor Elimination',         description: 'Ozone or steam treatment to neutralise odours inside the cabin.', price: 1500, duration: 60, category: 'Interior Clean' },
  // Combined Packages
  { name: 'Basic Wash & Vacuum',      description: 'Exterior wash plus a quick interior vacuum.',              price: 700,  duration: 45, category: 'Packages' },
  { name: 'Standard Wash',            description: 'Hand wash, interior vacuum, and dashboard wipe.',          price: 1000, duration: 60, category: 'Packages' },
  { name: 'Premium Wash',             description: 'Full hand wash, complete interior clean, and tyre shine.', price: 1500, duration: 75, category: 'Packages' },
  { name: 'Executive Wash',           description: 'Full exterior detail, complete interior, finishing wax, and tyre dressing.', price: 2000, duration: 90, category: 'Packages' },
  // Polish & Protection
  { name: 'Exterior Polish',          description: 'Machine or hand polish to remove light swirl marks and restore shine.', price: 3000, duration: 120, category: 'Polish & Protection' },
  { name: 'Wax Application',          description: 'Carnauba wax coat for a deep shine and paint protection.',  price: 2000, duration: 60, category: 'Polish & Protection' },
  { name: 'Paint Correction',         description: 'Multi-stage decontamination and correction for deeper scratches and oxidation.', price: 8000, duration: 240, category: 'Polish & Protection' },
  { name: 'Ceramic Coating',          description: 'Long-lasting nano-ceramic paint protection layer.',          price: 15000, duration: 300, category: 'Polish & Protection' },
  { name: 'Paint Protection Film',    description: 'Self-healing PPF applied to high-impact panels.',            price: 20000, duration: 360, category: 'Polish & Protection' },
  // Full Detailing
  { name: 'Full Detail',              description: 'Comprehensive interior and exterior detailing service.',      price: 5000, duration: 180, category: 'Full Detail' },
  // Engine & Wheels
  { name: 'Engine Bay Clean',         description: 'Safe degreasing and rinse of the engine bay.',               price: 1500, duration: 60, category: 'Engine & Wheels' },
  { name: 'Tyre & Wheel Clean',       description: 'Brake dust removal, wheel scrub, and tyre shine.',           price: 500,  duration: 20, category: 'Engine & Wheels' },
  { name: 'Alloy Wheel Polish',       description: 'Deep clean and machine polish of alloy wheels.',             price: 1500, duration: 45, category: 'Engine & Wheels' },
  // Glass & Upholstery
  { name: 'Windscreen Treatment',     description: 'Water-repellent coating applied to the windscreen.',         price: 500,  duration: 20, category: 'Glass & Upholstery' },
  { name: 'Upholstery Shampoo',       description: 'Deep shampoo clean of fabric seats and floor carpets.',      price: 2000, duration: 90, category: 'Glass & Upholstery' },
  { name: 'Leather Conditioning',     description: 'Clean, condition, and protect genuine leather seats.',        price: 2000, duration: 75, category: 'Glass & Upholstery' },
  { name: 'Window Tinting',           description: 'UV-protective window tint film applied to side and rear glass.', price: 5000, duration: 120, category: 'Glass & Upholstery' },
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
        VALUES (${ownerId}, ${template.name}, ${template.description}, ${template.default_price}, ${template.default_duration}, ${template.category}, false)
        RETURNING *
      `;
      return res.status(201).json(mapService(service));
    }

    const { name, description, price, duration, category, imageUrl } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ error: 'Name, price, and duration are required' });
    const [service] = await sql`
      INSERT INTO services (owner_id, name, description, price, duration, category, image_url)
      VALUES (${ownerId}, ${name}, ${description || null}, ${price}, ${duration}, ${category || 'Basic'}, ${imageUrl || null})
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
