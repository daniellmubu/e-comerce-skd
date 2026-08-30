package com.skd.sublimacion_api.config;

import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.entity.TarifaEnvio;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.entity.VarianteProducto;
import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final EmpaqueRepository empaqueRepository;
    private final CuponRepository cuponRepository;
    private final DireccionRepository direccionRepository;
    private final CarritoRepository carritoRepository;
    private final ItemCarritoRepository itemCarritoRepository;
    private final TarifaEnvioRepository tarifaEnvioRepository;
    private final VarianteProductoRepository varianteProductoRepository;

    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {

        System.out.println("=================================");
        System.out.println("Cargando datos de prueba...");
        System.out.println("=================================");

        crearUsuarios();
        crearCategorias();
        crearProductos();
        crearEmpaques();
        crearCupones();
        crearDirecciones();
        crearCarritoConItems();
        crearTarifasEnvio();
        crearVariantes();

        System.out.println("=================================");
        System.out.println("Datos de prueba verificados/cargados.");
        System.out.println("=================================");
    }

    private void crearUsuarios() {

        if (!usuarioRepository.existsByUsername("admin")) {

            Usuario admin = Usuario.builder()
                    .nombre("Administrador")
                    .username("admin")
                    .correo("admin@skd.com")
                    .contrasenaHash(passwordEncoder.encode("Admin123*"))
                    .rol(Rol.admin)
                    .build();

            usuarioRepository.save(admin);
        }

        if (!usuarioRepository.existsByUsername("daniel")) {

            Usuario cliente = Usuario.builder()
                    .nombre("Daniel")
                    .username("daniel")
                    .correo("daniel@correo.com")
                    .contrasenaHash(passwordEncoder.encode("123456"))
                    .rol(Rol.cliente)
                    .build();

            usuarioRepository.save(cliente);
        }

        System.out.println("✔ Usuarios verificados");
    }

    private void crearCategorias() {

        crearCategoriaSiNoExiste("Mugs", "Mugs personalizados");
        crearCategoriaSiNoExiste("Jarras", "Jarras cerveceras personalizadas");
        crearCategoriaSiNoExiste("Gorras", "Gorras sublimadas");
        crearCategoriaSiNoExiste("Cojines", "Cojines personalizados");
        crearCategoriaSiNoExiste("Llaveros", "Llaveros personalizados");

        System.out.println("✔ Categorías verificadas");
    }

    private void crearCategoriaSiNoExiste(String nombre, String descripcion) {
        if (categoriaRepository.findByNombre(nombre).isEmpty()) {
            Categoria categoria = Categoria.builder()
                    .nombre(nombre)
                    .descripcion(descripcion)
                    .build();
            categoriaRepository.save(categoria);
        }
    }

    private void crearProductos() {

        Categoria mugs = categoriaRepository.findByNombre("Mugs")
                .orElseThrow(() -> new IllegalStateException("Categoría Mugs no existe"));
        Categoria jarras = categoriaRepository.findByNombre("Jarras")
                .orElseThrow(() -> new IllegalStateException("Categoría Jarras no existe"));
        Categoria gorras = categoriaRepository.findByNombre("Gorras")
                .orElseThrow(() -> new IllegalStateException("Categoría Gorras no existe"));
        Categoria cojines = categoriaRepository.findByNombre("Cojines")
                .orElseThrow(() -> new IllegalStateException("Categoría Cojines no existe"));
        Categoria llaveros = categoriaRepository.findByNombre("Llaveros")
                .orElseThrow(() -> new IllegalStateException("Categoría Llaveros no existe"));

        crearProductoSiNoExiste("Mug Cerámico Blanco 11oz", "Mug clásico para sublimación", new BigDecimal("18000"), 100, mugs);
        crearProductoSiNoExiste("Mug Mágico Negro", "Mug que revela el diseño con el calor", new BigDecimal("25000"), 60, mugs);
        crearProductoSiNoExiste("Jarra Cervecera 500ml", "Jarra cervecera de vidrio para sublimación", new BigDecimal("32000"), 40, jarras);
        crearProductoSiNoExiste("Gorra Trucker Sublimable", "Gorra malla trasera con frente sublimable", new BigDecimal("28000"), 45, gorras);
        crearProductoSiNoExiste("Gorra Clásica Algodón", "Gorra de algodón con panel sublimable", new BigDecimal("26000"), 45, gorras);
        crearProductoSiNoExiste("Cojín Cuadrado 40x40", "Cojín decorativo con funda sublimable", new BigDecimal("32000"), 30, cojines);
        crearProductoSiNoExiste("Cojín Decorativo Redondo", "Cojín redondo edición especial", new BigDecimal("34000"), 25, cojines);
        crearProductoSiNoExiste("Llavero Acrílico Personalizado", "Llavero acrílico transparente con impresión", new BigDecimal("9000"), 150, llaveros);
        crearProductoSiNoExiste("Llavero Metálico Grabado", "Llavero metálico grabado por sublimación", new BigDecimal("12000"), 120, llaveros);

        System.out.println("✔ Productos verificados");
    }

    private void crearProductoSiNoExiste(String nombre, String descripcion, BigDecimal precio, int stock, Categoria categoria) {
        if (productoRepository.findByNombre(nombre).isEmpty()) {
            Producto producto = Producto.builder()
                    .nombre(nombre)
                    .descripcion(descripcion)
                    .precio(precio)
                    .stock(stock)
                    .categoria(categoria)
                    .activo(true)
                    .build();
            productoRepository.save(producto);
        }
    }

    private void crearEmpaques() {

        crearEmpaqueSiNoExiste("Estandar", "Empaque estándar en bolsa sellada", BigDecimal.ZERO);
        crearEmpaqueSiNoExiste("Premium", "Caja premium con papel de seda", new BigDecimal("5000"));
        crearEmpaqueSiNoExiste("Regalo", "Empaque tipo regalo con moño y tarjeta", new BigDecimal("8000"));

        System.out.println("✔ Empaques verificados");
    }

    private void crearEmpaqueSiNoExiste(String tipo, String descripcion, BigDecimal costoAdicional) {
        if (empaqueRepository.findByTipo(tipo).isEmpty()) {
            Empaque empaque = Empaque.builder()
                    .tipo(tipo)
                    .descripcion(descripcion)
                    .costoAdicional(costoAdicional)
                    .build();
            empaqueRepository.save(empaque);
        }
    }

    private void crearCupones() {

        crearCuponSiNoExiste("BIENVENIDA10", new BigDecimal("10.00"),
                LocalDate.now(), LocalDate.now().plusMonths(6), 100);
        crearCuponSiNoExiste("SKD20", new BigDecimal("20.00"),
                LocalDate.now(), LocalDate.now().plusMonths(1), 50);

        System.out.println("✔ Cupones verificados");
    }

    private void crearCuponSiNoExiste(String codigo, BigDecimal descuentoPorcentaje, LocalDate inicio, LocalDate fin, int usosMaximos) {
        if (cuponRepository.findByCodigo(codigo).isEmpty()) {
            Cupon cupon = Cupon.builder()
                    .codigo(codigo)
                    .descuentoPorcentaje(descuentoPorcentaje)
                    .fechaInicio(inicio)
                    .fechaFin(fin)
                    .usosMaximos(usosMaximos)
                    .usosActuales(0)
                    .activo(true)
                    .build();
            cuponRepository.save(cupon);
        }
    }

    private void crearDirecciones() {

        Usuario daniel = usuarioRepository.findByUsername("daniel")
                .orElseThrow(() -> new IllegalStateException("Usuario daniel no existe"));

        if (direccionRepository.findByUsuarioId(daniel.getId()).isEmpty()) {
            Direccion direccion = Direccion.builder()
                    .usuario(daniel)
                    .calle("Calle 45 # 12-30")
                    .ciudad("Ibagué")
                    .departamento("Tolima")
                    .codigoPostal("730001")
                    .predeterminada(true)
                    .build();
            direccionRepository.save(direccion);
        }

        System.out.println("✔ Direcciones verificadas");
    }

    private void crearCarritoConItems() {

        Usuario daniel = usuarioRepository.findByUsername("daniel")
                .orElseThrow(() -> new IllegalStateException("Usuario daniel no existe"));

        Carrito carrito = carritoRepository.findByUsuarioId(daniel.getId())
                .orElseGet(() -> {
                    Carrito nuevo = Carrito.builder()
                            .usuario(daniel)
                            .build();
                    return carritoRepository.save(nuevo);
                });

        if (itemCarritoRepository.findByCarritoId(carrito.getId()).isEmpty()) {

            Producto mug = productoRepository.findByNombre("Mug Cerámico Blanco 11oz")
                    .orElseThrow(() -> new IllegalStateException("Producto Mug Cerámico Blanco 11oz no existe"));

            ItemCarrito itemUno = ItemCarrito.builder()
                    .carrito(carrito)
                    .producto(mug)
                    .cantidad(1)
                    .precioUnitario(mug.getPrecio())
                    .build();

            itemCarritoRepository.saveAll(List.of(itemUno));
        }

        System.out.println("✔ Carrito e items verificados");
    }

    // Tarifas de envío de ejemplo por departamento de Colombia. El cálculo
    // busca por direccion.departamento; los departamentos sin tarifa usan
    // el valor por defecto en EnvioServiceImpl.
    private void crearTarifasEnvio() {

        crearTarifaSiNoExiste("Bogotá D.C.", new BigDecimal("8000"), 2);
        crearTarifaSiNoExiste("Cundinamarca", new BigDecimal("8000"), 2);
        crearTarifaSiNoExiste("Antioquia", new BigDecimal("12000"), 3);
        crearTarifaSiNoExiste("Valle del Cauca", new BigDecimal("12000"), 3);
        crearTarifaSiNoExiste("Santander", new BigDecimal("10000"), 3);
        crearTarifaSiNoExiste("Tolima", new BigDecimal("10000"), 3);
        crearTarifaSiNoExiste("Norte de Santander", new BigDecimal("11000"), 4);
        crearTarifaSiNoExiste("Atlántico", new BigDecimal("14000"), 4);
        crearTarifaSiNoExiste("Bolívar", new BigDecimal("15000"), 5);
        crearTarifaSiNoExiste("Magdalena", new BigDecimal("15000"), 5);

        System.out.println("✔ Tarifas de envío verificadas");
    }

    private void crearTarifaSiNoExiste(
            String departamento,
            BigDecimal costoBase,
            int diasEstimados) {

        if (tarifaEnvioRepository
                .findByDepartamentoIgnoreCase(departamento)
                .isEmpty()) {

            TarifaEnvio tarifa = TarifaEnvio.builder()
                    .departamento(departamento)
                    .costoBase(costoBase)
                    .diasEstimados(diasEstimados)
                    .build();

            tarifaEnvioRepository.save(tarifa);
        }
    }

    // Variantes de producto (talla/color/stock/precio) para que Jeanpierre pueda mockear
    private void crearVariantes() {

        Categoria mugs = categoriaRepository.findByNombre("Mugs")
                .orElseThrow(() -> new IllegalStateException("Categoría Mugs no existe"));
        Categoria gorras = categoriaRepository.findByNombre("Gorras")
                .orElseThrow(() -> new IllegalStateException("Categoría Gorras no existe"));

        // Mug Cerámico Blanco 11oz
        Producto mug = productoRepository.findByNombre("Mug Cerámico Blanco 11oz")
                .orElseThrow(() -> new IllegalStateException("Producto Mug Cerámico Blanco 11oz no existe"));
        crearVarianteSiNoExiste(mug, "Única", "Blanco", new BigDecimal("18000"), 100);
        crearVarianteSiNoExiste(mug, "Única", "Negro", new BigDecimal("18000"), 80);
        crearVarianteSiNoExiste(mug, "Única", "Rojo", new BigDecimal("18000"), 60);
        crearVarianteSiNoExiste(mug, "Única", "Azul", new BigDecimal("18000"), 60);

        // Mug Mágico Negro (mismo modelo, color base oscuro)
        Producto mugMagico = productoRepository.findByNombre("Mug Mágico Negro")
                .orElseThrow(() -> new IllegalStateException("Producto Mug Mágico Negro no existe"));
        crearVarianteSiNoExiste(mugMagico, "Única", "Negro", new BigDecimal("25000"), 60);
        crearVarianteSiNoExiste(mugMagico, "Única", "Blanco", new BigDecimal("25000"), 40);

        // Jarra Cervecera 500ml
        Producto jarra = productoRepository.findByNombre("Jarra Cervecera 500ml")
                .orElseThrow(() -> new IllegalStateException("Producto Jarra Cervecera 500ml no existe"));
        crearVarianteSiNoExiste(jarra, "Única", "Transparente", new BigDecimal("32000"), 40);
        crearVarianteSiNoExiste(jarra, "Única", "Escarchada", new BigDecimal("35000"), 30);

        // Gorra Trucker
        Producto gorra = productoRepository.findByNombre("Gorra Trucker Sublimable")
                .orElseThrow(() -> new IllegalStateException("Producto Gorra Trucker Sublimable no existe"));
        crearVarianteSiNoExiste(gorra, "Única", "Negro", new BigDecimal("28000"), 45);
        crearVarianteSiNoExiste(gorra, "Única", "Blanco", new BigDecimal("28000"), 30);
        crearVarianteSiNoExiste(gorra, "Única", "Azul Marino", new BigDecimal("28000"), 30);
        crearVarianteSiNoExiste(gorra, "Única", "Rojo", new BigDecimal("28000"), 25);

        System.out.println("✔ Variantes verificadas");
    }

    private void crearVarianteSiNoExiste(
            Producto producto,
            String talla,
            String color,
            BigDecimal precio,
            int stock) {

        if (varianteProductoRepository
                .findByProductoIdAndTallaAndColor(producto.getId(), talla, color)
                .isEmpty()) {

            VarianteProducto variante = VarianteProducto.builder()
                    .producto(producto)
                    .talla(talla)
                    .color(color)
                    .precio(precio)
                    .stock(stock)
                    .build();

            varianteProductoRepository.save(variante);
        }
    }
}