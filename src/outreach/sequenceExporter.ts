import { Business } from '../types/business.js';
import { ComprehensiveSequence } from '../types/outreach.js';

export interface LeadSequencePair {
  lead: Business;
  sequence: ComprehensiveSequence;
}

export class SequenceExporter {
  /**
   * Escape CSV fields properly
   */
  private static escapeCsv(value: string | number | undefined | null): string {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Export to Instantly.ai / Smartlead / Lemlist multi-step CSV format
   */
  public static toInstantlyCsv(pairs: LeadSequencePair[]): string {
    if (pairs.length === 0) return '';

    // Determine max email steps
    const maxEmailSteps = Math.max(
      ...pairs.map((p) => p.sequence.touchpoints.filter((t) => t.channel === 'email').length),
      3
    );

    // Build Header
    const headers = [
      'Email',
      'CompanyName',
      'Website',
      'Phone',
      'City',
      'Category',
      'LeadScore',
      'DealValue',
    ];

    for (let i = 1; i <= maxEmailSteps; i++) {
      headers.push(`Subject ${i}`, `Body ${i}`, `Delay ${i}`);
    }

    const rows: string[] = [headers.join(',')];

    for (const { lead, sequence } of pairs) {
      const emailSteps = sequence.touchpoints.filter((t) => t.channel === 'email');
      const row = [
        this.escapeCsv(lead.email || ''),
        this.escapeCsv(lead.name),
        this.escapeCsv(lead.website || ''),
        this.escapeCsv(lead.phone || ''),
        this.escapeCsv(lead.area || ''),
        this.escapeCsv(lead.category || ''),
        this.escapeCsv(lead.opportunityScore || 70),
        this.escapeCsv(lead.estimatedDealValue || 20000),
      ];

      for (let i = 0; i < maxEmailSteps; i++) {
        const step = emailSteps[i];
        if (step) {
          row.push(
            this.escapeCsv(step.subject || ''),
            this.escapeCsv(step.body || ''),
            this.escapeCsv(step.dayDelay)
          );
        } else {
          row.push('""', '""', '""');
        }
      }

      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Export sequence to automation-ready JSON
   */
  public static toJson(sequence: ComprehensiveSequence): string {
    return JSON.stringify(sequence, null, 2);
  }

  /**
   * Export sequence to clean, human-readable Markdown format with battlecards
   */
  public static toMarkdown(sequence: ComprehensiveSequence): string {
    let md = `# ${sequence.archetypeEmoji} ${sequence.archetypeName} - ${sequence.businessName}\n\n`;
    md += `**Target Area:** ${sequence.area} | **Category:** ${sequence.category} | **Tone:** ${sequence.tone}\n`;
    md += `**Total Duration:** ${sequence.totalDurationDays} Days | **Touchpoints:** ${sequence.touchpoints.length}\n`;
    md += `**Description:** ${sequence.description}\n\n`;
    md += `---\n\n`;

    for (const tp of sequence.touchpoints) {
      md += `## ${tp.channelEmoji} Step ${tp.stepNumber}: ${tp.title} (Delay: Day ${tp.dayDelay})\n`;
      md += `**Channel:** \`${tp.channel.toUpperCase()}\``;
      if (tp.condition) md += ` | **Condition:** *${tp.condition}*`;
      md += `\n\n`;

      if (tp.subject) {
        md += `**Subject:** \`${tp.subject}\`\n\n`;
      }

      md += `\`\`\`text\n${tp.body}\n\`\`\`\n\n`;

      if (tp.actionGuidance) {
        md += `> 💡 **Rep Action Guidance:** ${tp.actionGuidance}\n\n`;
      }

      if (tp.callBattlecard) {
        md += `### 📞 Cold Call Battlecard\n`;
        md += `- **Opener:** ${tp.callBattlecard.opener}\n`;
        md += `- **Discovery Question:** ${tp.callBattlecard.discovery}\n`;
        md += `- **Objection Handling:** ${tp.callBattlecard.objectionHandling}\n`;
        if (tp.callBattlecard.voicemailScript) {
          md += `- **Voicemail Script:** ${tp.callBattlecard.voicemailScript}\n`;
        }
        md += `- **Close:** ${tp.callBattlecard.close}\n\n`;
      }

      md += `---\n\n`;
    }

    return md;
  }
}
