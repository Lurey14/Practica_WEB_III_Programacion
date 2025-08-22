using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Practica1.Models;
using System.Text.Json;

namespace Practica1.Pages
{
    public class CanceladaModel : PageModel
    {
        public List<Tarea> Tareas { get; set; } = new List<Tarea>();
        public int PaginaActual { get; set; } = 1;
        public int TamanoPagina { get; set; } = 5;
        public int TotalPaginas { get; set; } = 1;
        public int TotalTareas { get; set; } = 0;

        public void OnGet(int pagina = 1, int tamanio = 5)
        {
            if (pagina < 1) pagina = 1;
            if (tamanio < 1) tamanio = 5;

            PaginaActual = pagina;
            TamanoPagina = tamanio;

            try
            {
                string jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "tareas.json");
                if (System.IO.File.Exists(jsonFilePath))
                {
                    var jsonContent = System.IO.File.ReadAllText(jsonFilePath);
                    var todasLasTareas = JsonSerializer.Deserialize<List<Tarea>>(jsonContent) ?? new List<Tarea>();

                    var tareasCanceladas = todasLasTareas
                        .Where(t => t.estado == "Cancelado")
                        .ToList();

                    TotalTareas = tareasCanceladas.Count;
                    TotalPaginas = (int)Math.Ceiling(TotalTareas / (double)TamanoPagina);

                    if (PaginaActual > TotalPaginas && TotalPaginas > 0)
                        PaginaActual = TotalPaginas;

                    Tareas = tareasCanceladas
                        .Skip((PaginaActual - 1) * TamanoPagina)
                        .Take(TamanoPagina)
                        .ToList();
                }
            }
            catch (Exception ex)
            {
                Tareas = new List<Tarea>();
            }
        }
    }
}
