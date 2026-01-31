"use client";
import Editor from "@monaco-editor/react";

export default function CustomCodeEditor({ value, onChange }) {
	return (
		<Editor
			height="400px"
			defaultLanguage="html"
			value={value}
			onChange={(v) => onChange(v ?? "")}
			theme="vs-dark"
			options={{
				minimap: { enabled: false },
				fontSize: 14,
				wordWrap: "on",
				automaticLayout: true,
			}}
		/>
	);
}
