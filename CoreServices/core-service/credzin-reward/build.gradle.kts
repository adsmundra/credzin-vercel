plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
}

// Configure source sets for integration tests
sourceSets {
    create("integrationtest") {
        kotlin {
            srcDir("src/integrationtest/kotlin")
        }
        resources {
            srcDir("src/integrationtest/resources")
        }
        compileClasspath += sourceSets.main.get().output + sourceSets.test.get().output
        runtimeClasspath += sourceSets.main.get().output + sourceSets.test.get().output
    }
}

// Create integration test configuration
val integrationtestImplementation by configurations.getting {
    extendsFrom(configurations.testImplementation.get())
}

val integrationtestRuntimeOnly by configurations.getting {
    extendsFrom(configurations.testRuntimeOnly.get())
}

// Create integration test task
val integrationTest =
    tasks.register<Test>("integrationTest") {
        description = "Runs integration tests."
        group = "verification"

        testClassesDirs = sourceSets["integrationtest"].output.classesDirs
        classpath = sourceSets["integrationtest"].runtimeClasspath

        useJUnitPlatform()

        // Run after unit tests
        shouldRunAfter("test")
    }

// Make build task depend on integration tests
tasks.named("build") {
    dependsOn(integrationTest)
}

// Configure duplicate handling for integration test resources
tasks.named<ProcessResources>("processIntegrationtestResources") {
    duplicatesStrategy = DuplicatesStrategy.INCLUDE
}

dependencies {
    implementation(libs.kotlin.reflect)
    implementation(libs.kotlin.stdlib)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.dgs.spring.boot.starter)
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.junit.jupiter)
    testImplementation(libs.h2)
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
}
