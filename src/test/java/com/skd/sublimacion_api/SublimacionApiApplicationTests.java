package com.skd.sublimacion_api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestMockConfiguration.class)
class SublimacionApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
