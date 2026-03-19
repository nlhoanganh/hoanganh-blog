package com.blog.config;

import com.blog.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the in-memory database with sample posts on startup.
 * Remove or modify this class to start with an empty blog.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final PostService postService;

    @Override
    public void run(ApplicationArguments args) {
        postService.createPost(
                "Welcome to My Blog",
                """
                # Welcome!

                Thanks for visiting my blog. This is where I share my thoughts on software development,
                architecture, and the tools I find interesting.

                ## What You'll Find Here

                - **Technical deep-dives** – exploring frameworks, patterns, and best practices
                - **Project showcases** – things I've built and the lessons learned
                - **Quick tips** – small but useful discoveries from day-to-day coding

                Stay tuned — more posts are on the way!
                """,
                "welcome,introduction",
                null
        );

        postService.createPost(
                "Getting Started with Spring Boot 3",
                """
                # Spring Boot 3 — What's New?

                Spring Boot 3 brings Java 17 as a baseline, native compilation support via GraalVM,
                and a fully Jakarta EE 10 compatible codebase.

                ## Key Features

                1. **Auto-configuration** — Spring Boot detects your classpath and configures beans automatically.
                2. **Embedded Tomcat** — No external server needed; just run the JAR.
                3. **Production-ready actuator** — Health checks, metrics, and more out of the box.

                ## A Minimal App

                ```java
                @SpringBootApplication
                public class MyApp {
                    public static void main(String[] args) {
                        SpringApplication.run(MyApp.class, args);
                    }
                }
                ```

                Add a REST controller and you have a running API in seconds.

                ## Why H2 for Development?

                H2 is a lightweight, pure-Java in-memory database. It spins up instantly alongside your app,
                requires zero configuration, and includes a web console at `/h2-console`. Perfect for rapid
                prototyping — just swap in PostgreSQL or MySQL for production.
                """,
                "java,spring-boot,backend",
                null
        );

        postService.createPost(
                "Building Modern UIs with React and Tailwind CSS",
                """
                # React + Tailwind CSS — A Powerful Combination

                Tailwind's utility-first approach pairs beautifully with React's component model.
                Instead of maintaining separate CSS files, your styles live directly alongside your markup.

                ## Why Utility-First?

                - No more inventing class names for one-off styles
                - Consistent spacing, colour, and typography from a shared design scale
                - Responsive variants (`sm:`, `md:`, `lg:`) built in

                ## A Clean Card Component

                ```tsx
                const PostCard = ({ title, excerpt }: Props) => (
                  <div className="rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">{excerpt}</p>
                  </div>
                );
                ```

                ## TypeScript Makes It Safer

                Coupling React with TypeScript catches prop mismatches at compile time,
                not at runtime in production. The small upfront investment pays off
                as your component library grows.
                """,
                "react,typescript,frontend,tailwind",
                null
        );
    }
}
