plugins {
	id("org.springframework.boot") version libs.versions.spring.boot.get() apply false
	id("io.spring.dependency-management") version libs.versions.spring.dependency.management.get() apply false
	kotlin("jvm") version libs.versions.kotlin.get() apply false
	kotlin("plugin.spring") version libs.versions.kotlin.get() apply false
	kotlin("plugin.jpa") version libs.versions.kotlin.get() apply false
	kotlin("kapt") version libs.versions.kotlin.get() apply false
}

allprojects {
	group = "com.cusp"
	version = "0.0.1-SNAPSHOT"

	repositories {
		mavenCentral()
	}

}

subprojects {
	apply(plugin = "org.jetbrains.kotlin.jvm")
	apply(plugin = "org.jetbrains.kotlin.plugin.spring")
	apply(plugin = "org.jetbrains.kotlin.plugin.jpa")
	apply(plugin = "org.jetbrains.kotlin.kapt")

	if (project.name == "cusp-core") {
		apply(plugin = "org.springframework.boot")
		apply(plugin = "io.spring.dependency-management")
	}

	tasks.withType<JavaCompile> {
		sourceCompatibility = "21"
		targetCompatibility = "21"
	}

	tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
		kotlinOptions {
			freeCompilerArgs += "-Xjsr305=strict"
			jvmTarget = "21"
		}
	}

	tasks.withType<Test> {
		useJUnitPlatform()
	}
}
