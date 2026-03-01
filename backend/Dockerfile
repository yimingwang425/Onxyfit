# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN touch sonar-project.properties
# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -B -Pprod -DskipTests 2>/dev/null || true
COPY src src
RUN mvn package -Pprod -DskipTests \
    -Dskip.installnodenpm -Dskip.npm \
    -Dmaven.test.skip=true \
    -Dmodernizer.skip=true \
    -Dcheckstyle.skip=true \
    -Dnohttp.skip=true \
    -B -q \
    -Dmaven.compiler.fork=false

# Stage 2: Run
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT java -Xmx512m -Dserver.port=${PORT:-8080} -Dspring.profiles.active=prod -jar app.jar
