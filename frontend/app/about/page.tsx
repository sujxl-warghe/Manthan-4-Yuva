export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">About</span>
      <h1 className="mt-1 font-display text-4xl font-medium text-forest-950">The Mission</h1>
      <p className="mt-6 text-lg leading-relaxed text-charcoal/70">
        Every year, cities plant thousands of trees during monsoon drives. Every year, most of
        that story ends at the photo-op. VrukshaSetu exists to change what gets measured.
      </p>
      <p className="mt-4 leading-relaxed text-charcoal/70">
        <strong className="text-forest-900">Every Citizen → One Tree → One Guardian → Digital Tree
        Identity → Continuous Verification → 3-Year Survival Tracking.</strong> Each tree gets a
        permanent Tree Passport, a real GPS location, and a chain of custody — from a guardian, up
        through supervisors, institutions and city authority — so that when something goes wrong,
        someone is accountable, and when a tree fails, it&apos;s replaced and tracked again from zero.
      </p>
      <div className="mt-10 rounded-2xl border border-forest-900/10 bg-forest-950 p-8 text-cream">
        <p className="font-display text-2xl italic">
          &ldquo;Don&apos;t count trees. Count survivors.&rdquo;
        </p>
      </div>
      <p className="mt-8 text-sm text-charcoal/50">
        This is a hackathon prototype for the Nagpur Green Mission, built to demonstrate the
        product, the data model and the accountability workflow end-to-end.
      </p>
    </div>
  );
}
