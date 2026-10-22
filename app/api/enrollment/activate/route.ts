export async function POST() {
  return Response.json({ error: "Admin verifies payment and emails your child's credentials to the parent." }, { status: 403 });
}
