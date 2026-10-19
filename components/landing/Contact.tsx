export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="text-lg font-bold text-slate-900">
        Contact Us
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Have a question about MathsNMe, learning paths, or student support?
      </p>
      <a
        href="mailto:hello@mathsnme.com"
        className="mt-3 inline-block text-sm font-semibold text-[#B8860B] transition hover:text-[#8f6800]"
      >
        Email: rameshaol@gmail.com <br/>
        Contact: +91 7794998524
      </a>
    </section>
  );
}
