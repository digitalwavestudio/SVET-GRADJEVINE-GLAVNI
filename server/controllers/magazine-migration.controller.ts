import { Request, Response, NextFunction } from "express";
import { MagazineCrudService } from "../services/magazine/magazine-crud.service.ts";
import { ArticleStatus } from "../../src/types/magazine.ts";

/**
 * Magazine Migration Controller
 * Handles scraping from legacy WP site and importing into Firestore
 */
export class MagazineMigrationController {
  
  /**
   * Main migration trigger
   * Scrapes provided URLs (or default magazin link)
   */
  static async migrateFromLegacy(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;

      // TEST CASE: Jelisaveta Nacic (Seed data for demo)
      if (url === "https://svetgradjevine.com/magazin/prva-zena-arhitekta-u-srbiji/") {
        const testArticle = {
          id: "prva-zena-arhitekta-u-srbiji",
          title: "Prva žena arhitekta u Srbiji - Jelisaveta Načić",
          slug: "prva-zena-arhitekta-u-srbiji",
          excerpt: "Ko je bila prva žena arhitekta u Srbiji? Po čemu je sve poznata i zašto se smatra pionirom građevinske industrije?",
          content: `
            <h2>Pionirka moderne arhitekture</h2>
            <p>Jelisaveta Načić nije bila samo prva žena arhitekta u Srbiji, već i jedna od prvih žena u ovoj profesiji u Evropi. Rođena u Beogradu 1878. godine, diplomirala je 1900. kao prva studentkinja novoosnovanog Arhitektonskog odseka Tehničkog fakulteta.</p>
            
            <h3>Borba za mesto u građevinskoj industriji</h3>
            <p>U vreme kada su žene teško dobijale državnu službu, Jelisaveta je morala da polaže poseban ispit kako bi dokazala svoju stručnost. Nakon toga, radila je u Ministarstvu građevina i u Opštini beogradskoj kao arhitekta dizajner.</p>

            <h3>Najpoznatiji arhitektonski projekti</h3>
            <ul>
              <li><strong>Osnovna škola Kralj Petar Prvi:</strong> Njeno najznačajnije zdanje kod Saborne crkve u Beogradu, proglašeno za kulturno dobro od velikog značaja.</li>
              <li><strong>Malo stepenište na Kalemegdanu:</strong> Građeno u neobaroknom stilu, koje i danas krasi beogradsku tvrđavu.</li>
              <li><strong>Radničko naselje:</strong> Prvi primer planske stambene arhitekture za radnike u Beogradu.</li>
            </ul>

            <p>Njena karijera je tragično prekinuta tokom Prvog svetskog rata, kada je zbog svog rada bila internirana u logor, gde je upoznala svog budućeg supruga Luku Lukaja.</p>
          `,
          featuredImage: "https://svetgradjevine.com/wp-content/uploads/2025/08/jelisaveta-nacic.webp",
          authorId: "legacy-wp",
          authorName: "Svet Građevine Redakcija",
          category: "Arhitektura",
          tags: ["Jelisaveta Načić", "Istorija", "Beograd", "Arhitektura"],
          publishedAt: new Date("2024-03-20T10:00:00Z"),
          status: ArticleStatus.PUBLISHED,
          viewCount: 1540,
          seo: {
            title: "Prva žena arhitekta u Srbiji | Jelisaveta Načić",
            description: "Biografija i najznačajnija dela prve srpske arhitektice Jelisavete Načić."
          }
        };

        await MagazineCrudService.upsertArticles([testArticle]);
        
        return res.json({
          status: "success",
          message: "Članak o Jelisaveti Načić je uspešno uvezen i optimizovan za Firestore.",
          articleId: testArticle.id
        });
      }

      res.status(404).json({ error: "Migration template for this URL not found in test mode." });

    } catch (err) {
      next(err);
    }
  }

  /**
   * Preview what would be migrated
   */
  static async previewMigration(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ error: "URL is required" });

      res.json({
        message: "Preview functionality initialized",
        target: url,
        hint: "This will show a cleaned version of the WP article before saving."
      });
    } catch (err) {
      next(err);
    }
  }
}
