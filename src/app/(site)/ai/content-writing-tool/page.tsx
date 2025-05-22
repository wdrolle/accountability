"use client";
import Options from "@/components/AiTools/Options";
import PreviewGeneratedText from "@/components/AiTools/PreviewGeneratedText";
import Breadcrumb from "@/components/Breadcrumb";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import z from "zod";
import { integrations, messages } from "../../../../../integrations.config";

const ContentGeneratorSchema = z.object({
  contentTopic: z.string(),
  numberOfParagraphs: z.string(),
  contentType: z.string(),
});

const paragraphsCount = [1, 2, 3, 4, 5];
const contentTypes = ["Article", "Listicles", "How to guides", "Tweet"];

const ContentGeneratorPage = () => {
  const [generatedContent, setGeneratedContent] = useState("");
  const [data, setData] = useState({
    contentTopic: "",
    numberOfParagraphs: "",
    contentType: "",
  });
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; total: number } | null>(null);

  const handleChange = (e: any) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const validation = ContentGeneratorSchema.safeParse(data);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setGeneratedContent("Loading....");

    const apiKey = localStorage.getItem("apiKey");
    
    try {
      const response = await axios.post(
        "/api/generate-content",
        { apiKey, prompt },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.error) {
        toast.error(response.data.error);
        setGeneratedContent("");
        return;
      }

      setGeneratedContent(response.data);
      
      // Update usage info if available in response
      if (response.headers['x-remaining-requests']) {
        setUsageInfo({
          remaining: parseInt(response.headers['x-remaining-requests']),
          total: parseInt(response.headers['x-total-requests'])
        });
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error(error.response.data.error);
      } else {
        setGeneratedContent("Error generating content. Please try again.");
      }
      console.error("Error:", error?.message);
    }

    setData({
      contentTopic: "",
      numberOfParagraphs: "",
      contentType: "",
    });
  };

  return (
    <>
      <title>Content Generator | AI Agents</title>
      <meta name="description" content="This is AI Examples page for AI Agents" />
      <Breadcrumb pageTitle="Content Generator" />

      <section className="pb-17.5 lg:pb-22.5 xl:pb-27.5">
        {/* <div className="gradient-box">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
            bibendum, lorem vel tincidunt imperdiet, nibh elit laoreet felis, a
            bibendum nisl tortor non orci. Donec pretium fermentum felis, quis
            aliquet est rutrum ut. Integer quis massa ut lacus viverra pharetra
            in eu lacus. Aliquam tempus odio adipiscing diam pellentesque
            rhoncus. Curabitur a bibendum est.{" "}
          </p>
        </div> */}

        <div className="mx-auto grid max-w-[1170px] gap-8 px-4 sm:px-8 lg:grid-cols-12 xl:px-0">
          <div className="gradient-box rounded-lg bg-dark-8 p-8 lg:col-span-4">
            <h2 className="pb-2 text-2xl font-bold text-white">
              Content Topic
            </h2>
            <p className="pb-6">What your content will be about?</p>
            <form onSubmit={handleSubmit}>
              <textarea
                value={data.contentTopic}
                name="contentTopic"
                onChange={handleChange}
                className="min-h-[160px] w-full rounded-lg border border-white/[0.12] bg-dark-7 p-5 text-white outline-none focus:border-purple"
                placeholder="Type your topic"
                required
              />

              <Options
                values={paragraphsCount}
                title={"Number of Paragraphs"}
                name={"numberOfParagraphs"}
                handleChange={handleChange}
                selected={data.numberOfParagraphs}
              />

              <Options
                values={contentTypes}
                title={"Select Type"}
                name={"contentType"}
                handleChange={handleChange}
                selected={data.contentType}
              />

              <button
                type="submit"
                className="hero-button-gradient mt-5 w-full rounded-lg px-7 py-3 text-center font-medium text-white duration-300 ease-in hover:opacity-80 "
              >
                Generate
              </button>
            </form>
          </div>

          <PreviewGeneratedText
            generatedContent={generatedContent}
            height={442}
          />
        </div>
      </section>
      {usageInfo && (
        <div className="text-sm text-white/80 mt-2">
          Remaining requests: {usageInfo.remaining}/{usageInfo.total}
        </div>
      )}
    </>
  );
};

export default ContentGeneratorPage;
