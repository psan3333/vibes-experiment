import React from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { colors } = useTheme();

  const markdownStyles = StyleSheet.create({
    body: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    heading1: {
      color: colors.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
    },
    heading2: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 14,
      marginBottom: 10,
    },
    heading3: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 8,
    },
    heading4: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 10,
      marginBottom: 6,
    },
    paragraph: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      marginVertical: 8,
    },
    strong: {
      fontWeight: 'bold',
      color: colors.primary,
    },
    em: {
      fontStyle: 'italic',
    },
    blockquote: {
      backgroundColor: colors.card,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
    },
    code_inline: {
      backgroundColor: colors.secondary + '20',
      color: colors.secondary,
      fontFamily: 'monospace',
      fontSize: 14,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: colors.secondary + '20',
      color: colors.text,
      fontFamily: 'monospace',
      fontSize: 13,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: colors.secondary + '20',
      color: colors.text,
      fontFamily: 'monospace',
      fontSize: 13,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    list_item: {
      color: colors.text,
      marginVertical: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 16,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: colors.card,
    },
    th: {
      padding: 8,
      fontWeight: 'bold',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    td: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });

  return (
    <View style={styles.container}>
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
