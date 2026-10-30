import Estimator from "@/components/Estimator";

export default function Page() {
  return (
    <main>
      <header className="top">
        <h1>What will your project cost?</h1>
        <p>Choose what you want built. The quote on the right updates as you go, no call needed.</p>
      </header>
      <Estimator />
      <footer className="foot">
        Prototype for Cynbit Technologies. Prices are placeholders, not an offer.
      </footer>
    </main>
  );
}
