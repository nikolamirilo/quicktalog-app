import { Container, Heading, Text, Link } from "@react-email/components"

function InformationEmail({
  email,
  name,
  message,
  subject,
}: {
  email: string
  name: string
  message: string
  subject: string
}) {
  return (
    <Container
      style={{
        backgroundColor: "#ffffff", // White background as requested
        fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
        padding: "0",
        borderRadius: "16px",
        maxWidth: "600px",
        margin: "20px auto",
        boxShadow: "0 8px 25px rgba(1, 14, 88, 0.15)",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}>
      {/* Header Section with high contrast */}
      <div
        style={{
          backgroundColor: "#ffffff", // White background
          padding: "40px 32px 32px",
          textAlign: "center",
          borderBottom: "3px solid #ffc107", // Yellow accent border
        }}>
        <Heading
          style={{
            fontSize: "28px",
            marginBottom: "12px",
            color: "#000000", // Pure black for maximum visibility
            textAlign: "center",
            fontWeight: "700",
            letterSpacing: "-0.01em",
            lineHeight: "1.2",
          }}>
          New Contact Message
        </Heading>
        <Text
          style={{
            fontSize: "16px",
            color: "#010e58", // Secondary color for subtitle
            textAlign: "center",
            margin: "0",
            fontWeight: "500",
          }}>
          You have received a new message from your website
        </Text>
      </div>

      {/* Content Section */}
      <div style={{ padding: "32px" }}>
        {/* Contact Info Cards */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #f3f4f6",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
              borderLeft: "4px solid #ffc107", // Yellow accent
            }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#010e58", // Secondary color
                textTransform: "uppercase",
                fontWeight: "600",
                letterSpacing: "0.05em",
                margin: "0 0 8px 0",
              }}>
              From
            </Text>
            <Text
              style={{
                fontSize: "18px",
                color: "#000000", // Black text
                fontWeight: "600",
                margin: "0",
                lineHeight: "1.4",
              }}>
              {name}
            </Text>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #f3f4f6",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
              borderLeft: "4px solid #ffc107", // Yellow accent
            }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#010e58", // Secondary color
                textTransform: "uppercase",
                fontWeight: "600",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}>
              Email Address
            </Text>
            <Link
              href={`mailto:${email}`}
              style={{
                fontSize: "16px",
                color: "#010e58", // Secondary color for links
                fontWeight: "500",
                textDecoration: "underline",
                padding: "8px 12px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                display: "inline-block",
              }}>
              {email}
            </Link>
          </div>

          {subject && (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "2px solid #f3f4f6",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
                borderLeft: "4px solid #ffc107", // Yellow accent
              }}>
              <Text
                style={{
                  fontSize: "12px",
                  color: "#010e58", // Secondary color
                  textTransform: "uppercase",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  margin: "0 0 8px 0",
                }}>
                Subject
              </Text>
              <Text
                style={{
                  fontSize: "16px",
                  color: "#000000", // Black text
                  fontWeight: "500",
                  margin: "0",
                  lineHeight: "1.4",
                }}>
                {subject}
              </Text>
            </div>
          )}

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #f3f4f6",
              borderRadius: "12px",
              padding: "20px",
              borderLeft: "4px solid #ffc107", // Yellow accent
            }}>
            <Text
              style={{
                fontSize: "12px",
                color: "#010e58", // Secondary color
                textTransform: "uppercase",
                fontWeight: "600",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}>
              Message
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: "#000000", // Black text for readability
                lineHeight: "1.6",
                margin: "0",
                whiteSpace: "pre-wrap",
                backgroundColor: "#f8f9fa",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}>
              {message}
            </Text>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link
            href={`mailto:${email}?subject=Re: ${subject || "Contact Form Message"}`}
            style={{
              backgroundColor: "#ffc107", // Yellow button
              color: "#000000", // Black text on yellow button
              padding: "14px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "600",
              display: "inline-block",
              border: "2px solid #ffc107",
              boxShadow: "0 2px 8px rgba(255, 193, 7, 0.3)",
            }}>
            Reply to {name}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "24px 32px",
          textAlign: "center",
          borderTop: "1px solid #e5e7eb",
        }}>
        <Text
          style={{
            fontSize: "14px",
            color: "#010e58", // Secondary color
            margin: "0 0 8px 0",
            lineHeight: "1.5",
          }}>
          Visit us at{" "}
          <Link
            href="https://www.quicktalog.app"
            style={{
              color: "#000000", // Black for links
              textDecoration: "underline",
              fontWeight: "600",
            }}>
            Quicktalog
          </Link>
        </Text>
        <Text
          style={{
            fontSize: "12px",
            color: "#6b7280",
            margin: "0",
          }}>
          &copy; {new Date().getFullYear()} Quicktalog. All rights reserved.
        </Text>
      </div>
    </Container>
  )
}

export default InformationEmail
