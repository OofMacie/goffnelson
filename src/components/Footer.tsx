import {
  FooterBrand
} from "flowbite-react"
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ background: "var(--nav-bg)", color: "var(--nav-text)", padding: "3rem 2rem", marginTop: "4rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
                <FooterBrand
              src="../images/logo/logo.png"
              alt="Goff Nelson Memorial Library Logo"
              name="Goff Nelson Memorial Library"
            />
            
          {/* About */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--nav-text-hover)" }}>
              About Us
            </h3>
            <p style={{ fontSize: "0.9rem", lineHeight: "1.6", opacity: 0.9 }}>
              Goff-Nelson Memorial Library has served Tupper Lake and the Adirondack region since 1916.
            </p>
          </div>

          {/* Hours */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--nav-text-hover)" }}>
              Hours
            </h3>
            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8", listStyle: "none", padding: 0, margin: 0 }}>
              <li>Monday, Wednesday, Friday: 10 AM - 6 PM</li>
              <li>Tuesday, Thursday: 10 AM - 8 PM</li>
              <li>Saturday: 10 AM - 2 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--nav-text-hover)" }}>
              Contact
            </h3>
            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8", listStyle: "none", padding: 0, margin: 0 }}>
              <li>📍 41 Lake Street, Tupper Lake, NY 12986</li>
              <li>📞 <a href="tel:+15183599421" style={{ color: "var(--nav-text-hover)", textDecoration: "none" }}>518-359-9421</a></li>
              <li>
                <a href="https://www.facebook.com/GoffNelsonMemorialLibrary" target="_blank" rel="noopener noreferrer" style={{ color: "var(--nav-text-hover)", textDecoration: "none" }}>
                  Facebook →
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.2)", margin: "2rem 0" }} />

        {/* Copyright */}
        <div style={{ textAlign: "center", fontSize: "0.85rem", opacity: 0.8 }}>
          <p style={{ margin: 0 }}>
            © {currentYear} Goff-Nelson Memorial Library. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
