# ---- Etapa 1: build ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Wrapper de Maven y pom primero (aprovecha la caché de capas)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw

# Descarga de dependencias (se cachea)
RUN ./mvnw dependency:go-offline -B || true

# Código fuente y compilación
COPY src src
RUN ./mvnw clean package -DskipTests

# ---- Etapa 2: runtime ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
