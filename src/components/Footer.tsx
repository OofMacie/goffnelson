import { librarySettings, formatOpeningTime } from "../lib/library-content";
import "../styles/library-footer.css";

export default function Footer() {
  const { about, hours, address, phone, phoneLink, facebook } = librarySettings;

  return (
    <footer className="library-footer">
      <div className="library-footer__inner">
        <div className="library-footer__grid">
          <div className="library-footer__brand">
            <img src="/images/logo/logo.png" className="library-footer__logo" alt="" loading="lazy" />
            <span>Goff-Nelson Memorial Library</span>
          </div>
          <section aria-labelledby="footer-about">
            <h2 id="footer-about">About us</h2>
            <p>{about}</p>
          </section>
          <section aria-labelledby="footer-hours">
            <h2 id="footer-hours">Library hours</h2>
            <ul>
              {hours.map(({ label, closed, opens, closes }) => (
                <li key={label}>
                  <span>{label}: </span>
                  {closed ? "Closed" : (
                    <>
                      <time dateTime={opens}>{formatOpeningTime(opens)}</time>
                      {" – "}
                      <time dateTime={closes}>{formatOpeningTime(closes)}</time>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact">Contact</h2>
            <address>
              <p>{address}</p>
              <p><a href={`tel:${phoneLink}`}>{phone}</a></p>
              <p><a href={facebook} target="_blank" rel="noopener noreferrer">Library Facebook page</a></p>
            </address>
          </section>
        </div>
        <hr className="library-footer__divider" />
        <p className="library-footer__copyright">
          © {new Date().getFullYear()} Goff-Nelson Memorial Library.
        </p>
      </div>
    </footer>
  );
}
