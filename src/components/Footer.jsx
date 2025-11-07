import React from "react";
import "./Footer.css";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaGithub } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext.jsx";

const FOOTER_I18N = {
  EN: {
    tagline:
      "Building AI-powered compliance and digital construction management tools for the next generation of builders and innovators.",
    quick_links: "Quick Links",
    about: "About Us",
    careers: "Careers",
    pricing: "Pricing",
    blog: "Blog",
    contact: "Contact",
    resources: "Resources",
    documentation: "Documentation",
    faq: "FAQ",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    security: "Security",
    stay_updated: "Stay Updated",
    subscribe_text:
      "Subscribe to receive updates on product releases and company news.",
    subscribe_placeholder: "Enter your email",
    subscribe_btn: "Subscribe",
    rights: "All rights reserved.",
    built_by: "Designed & built with love by",
  },
  CS: {
    tagline:
      "Budujeme nástroje pro správu shody a digitální řízení stavebnictví nové generace s podporou umělé inteligence.",
    quick_links: "Rychlé odkazy",
    about: "O nás",
    careers: "Kariéra",
    pricing: "Ceny",
    blog: "Blog",
    contact: "Kontakt",
    resources: "Zdroje",
    documentation: "Dokumentace",
    faq: "FAQ",
    terms: "Smluvní podmínky",
    privacy: "Ochrana soukromí",
    security: "Zabezpečení",
    stay_updated: "Zůstaňte v obraze",
    subscribe_text:
      "Přihlaste se k odběru novinek o vydáních produktů a firemních zprávách.",
    subscribe_placeholder: "Zadejte svůj e-mail",
    subscribe_btn: "Odebírat",
    rights: "Všechna práva vyhrazena.",
    built_by: "Navrženo a vytvořeno s láskou týmem",
  },
};

const t = (lang, key) => FOOTER_I18N[lang]?.[key] ?? FOOTER_I18N.EN[key];

export default function Footer() {
  const { selectedLanguage } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Column 1 */}
        <div>
          <h2>DigiStav | Validorix</h2>
          <p>{t(selectedLanguage, "tagline")}</p>
          <div className="footer-icons">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaLinkedinIn /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaGithub /></a>
          </div>
        </div>

        {/* Column 2 */}
        <div>
          <h3>{t(selectedLanguage, "quick_links")}</h3>
          <ul>
            <li><a href="/about">{t(selectedLanguage, "about")}</a></li>
            <li><a href="/careers">{t(selectedLanguage, "careers")}</a></li>
            <li><a href="/pricing">{t(selectedLanguage, "pricing")}</a></li>
            <li><a href="/blog">{t(selectedLanguage, "blog")}</a></li>
            <li><a href="/contact">{t(selectedLanguage, "contact")}</a></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3>{t(selectedLanguage, "resources")}</h3>
          <ul>
            <li><a href="/docs">{t(selectedLanguage, "documentation")}</a></li>
            <li><a href="/faq">{t(selectedLanguage, "faq")}</a></li>
            <li><a href="/terms">{t(selectedLanguage, "terms")}</a></li>
            <li><a href="/privacy">{t(selectedLanguage, "privacy")}</a></li>
            <li><a href="/security">{t(selectedLanguage, "security")}</a></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3>{t(selectedLanguage, "stay_updated")}</h3>
          <p>{t(selectedLanguage, "subscribe_text")}</p>
          <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder={t(selectedLanguage, "subscribe_placeholder")}
              required
            />
            <button type="submit">{t(selectedLanguage, "subscribe_btn")}</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <p>
            © {new Date().getFullYear()} DigiStav | Validorix. {t(selectedLanguage, "rights")}
          </p>
          <p>
            {t(selectedLanguage, "built_by")}{" "}
            <a href="https://oudenx.com" target="_blank" rel="noreferrer">
              OudenX
            </a>.
          </p>
        </div>

        {/* Bottom-right label */}
        <div className="footer-bottom-right">
          <span>DigiStav Group s.r.o.</span>
        </div>
      </div>
    </footer>
  );
}
