import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from "@react-pdf/renderer";

type PdfProps = {
  score: number;
  verdict: string;
  micro: string;
  gaps: string[];
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0b0f14",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 18,
    color: "#4b5563",
  },
  scoreBox: {
    border: "1 solid #111827",
    padding: 14,
    marginBottom: 18,
  },
  score: {
    fontSize: 36,
    fontWeight: "bold",
  },
  verdict: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "bold",
  },
  micro: {
    marginTop: 6,
    color: "#374151",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },
  bullet: {
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 9,
    color: "#6b7280",
  },
});

/**
 * IMPORTANT: Return type is explicitly a Document element so `pdf()` typechecks.
 */
export function ScorePdf({
  score,
  verdict,
  micro,
  gaps,
}: PdfProps): React.ReactElement<DocumentProps> {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Compliance Reality Breakdown</Text>
        <Text style={styles.subtitle}>
          A snapshot of how your compliance behaves under pressure.
        </Text>

        <View style={styles.scoreBox}>
          <Text style={styles.score}>{score} / 100</Text>
          <Text style={styles.verdict}>{verdict}</Text>
          <Text style={styles.micro}>{micro}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where points were lost</Text>
          {gaps.map((g, i) => (
            <Text key={i} style={styles.bullet}>
              • {g}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What operators usually fix first</Text>
          <Text style={styles.bullet}>• Evidence that survives outside audit windows</Text>
          <Text style={styles.bullet}>• Clear ownership (who actually has to act)</Text>
          <Text style={styles.bullet}>• Controls that fail loudly (not silently)</Text>
        </View>

        <Text style={styles.footer}>
          Generated anonymously. No frameworks. No vendor agenda.
        </Text>
      </Page>
    </Document>
  );
}
