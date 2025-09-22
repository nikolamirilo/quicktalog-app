import Head from 'next/head'

interface JsonLdScriptProps {
    schema: any
}

const JsonLdScript: React.FC<JsonLdScriptProps> = ({ schema }) => {
    return (
        <Head>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
        </Head>
    )
}

export default JsonLdScript