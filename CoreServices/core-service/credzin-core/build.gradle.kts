plugins {
    id("org.springframework.boot")
    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
}

dependencies {
    // Include reward module - core depends on reward, not the other way around
    implementation(project(":credzin-reward"))
    
    implementation(platform("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:3.10.2"))
    implementation(libs.kotlin.reflect)
    implementation(libs.kotlin.stdlib)
    implementation(libs.jackson.module.kotlin)
    
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.security)
    
    implementation("com.netflix.graphql.dgs:graphql-dgs-spring-boot-starter")
    // Removed non-existent DGS extended scalars dependency
    // If needed, use graphql-java-extended-scalars instead:
    // implementation("com.graphql-java:graphql-java-extended-scalars:21.0")
    
    implementation(libs.postgresql)
    implementation(libs.flyway.core)
    implementation(libs.flyway.database.postgresql)
    
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.junit.jupiter)
    // Removed non-existent DGS extended testing dependency
    
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
} 