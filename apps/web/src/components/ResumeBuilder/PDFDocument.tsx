"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Resume } from "@/constants/dummy";

// Register fonts if needed (optional - uses default fonts for now)
// Font.register({ family: 'Outfit', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 10,
    color: "#666",
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    paddingBottom: 3,
  },
  experienceItem: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  company: {
    fontSize: 11,
    color: "#333",
    marginBottom: 2,
  },
  dates: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillItem: {
    fontSize: 10,
    backgroundColor: "#f3f4f6",
    padding: "4 8",
    borderRadius: 4,
  },
});

interface PDFDocumentProps {
  data: Resume;
  accentColor: string;
}

export default function PDFDocument({ data, accentColor }: PDFDocumentProps) {
  const accentStyles = StyleSheet.create({
    accent: {
      color: accentColor,
    },
    accentBorder: {
      borderBottomColor: accentColor,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, accentStyles.accentBorder]}>
          <Text style={[styles.name, accentStyles.accent]}>{data.personalInfo.fullName}</Text>
          {data.personalInfo.email && <Text style={styles.contactInfo}>Email: {data.personalInfo.email}</Text>}
          {data.personalInfo.phone && <Text style={styles.contactInfo}>Phone: {data.personalInfo.phone}</Text>}
          {data.personalInfo.location && <Text style={styles.contactInfo}>Location: {data.personalInfo.location}</Text>}
        </View>

        {/* Professional Summary */}
        {data.professionalSummary && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, accentStyles.accent]}>Professional Summary</Text>
            <Text style={styles.description}>{data.professionalSummary.replace(/<[^>]*>/g, "")}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, accentStyles.accent]}>Work Experience</Text>
            {data.experience.map((exp) => (
              <View key={exp._id} style={styles.experienceItem}>
                <Text style={styles.jobTitle}>{exp.position}</Text>
                <Text style={styles.company}>{exp.company}</Text>
                <Text style={styles.dates}>
                  {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                </Text>
                {exp.description && <Text style={styles.description}>{exp.description.replace(/<[^>]*>/g, "")}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, accentStyles.accent]}>Education</Text>
            {data.education.map((edu) => (
              <View key={edu._id} style={styles.experienceItem}>
                <Text style={styles.jobTitle}>
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </Text>
                <Text style={styles.company}>{edu.institution}</Text>
                {edu.graduationDate && <Text style={styles.dates}>Graduated: {edu.graduationDate}</Text>}
                {edu.gpa && <Text style={styles.description}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.project && data.project.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, accentStyles.accent]}>Projects</Text>
            {data.project.map((proj) => (
              <View key={proj._id} style={styles.experienceItem}>
                <Text style={styles.jobTitle}>{proj.name}</Text>
                {proj.type && <Text style={styles.company}>{proj.type}</Text>}
                {proj.description && <Text style={styles.description}>{proj.description.replace(/<[^>]*>/g, "")}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, accentStyles.accent]}>Skills</Text>
            <View style={styles.skillsContainer}>
              {data.skills.map((skill) => (
                <Text key={skill} style={styles.skillItem}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
