package com.skd.sublimacion_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SublimacionApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SublimacionApiApplication.class, args);
	}

}
