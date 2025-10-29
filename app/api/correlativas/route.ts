import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { planId, materiaId, correlativaId, tipo } = await req.json();
    if (!planId || !materiaId || !correlativaId || !tipo) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const supabase = await createClient();
    const table = tipo === 'cursado' ? 'correlatividades_cursado' : 'correlatividades_final';
    const { error } = await supabase
      .from(table)
      .insert({ plan_id: planId, materia_id: materiaId, correlativa_id: correlativaId });

    if (error) {
      console.error('POST /api/correlativas -> supabase error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Error al insertar' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('POST /api/correlativas -> unexpected:', e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req: Request) {
  try {
    const { planId, materiaId, correlativaId, tipo } = await req.json();
    if (!planId || !materiaId || !correlativaId || !tipo) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const supabase = await createClient();
    const table = tipo === 'cursado' ? 'correlatividades_cursado' : 'correlatividades_final';
    const { error } = await supabase
      .from(table)
      .delete()
      .match({ plan_id: planId, materia_id: materiaId, correlativa_id: correlativaId });

    if (error) {
      console.error('DELETE /api/correlativas -> supabase error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Error al eliminar' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('DELETE /api/correlativas -> unexpected:', e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
