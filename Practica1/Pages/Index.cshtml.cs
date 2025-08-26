using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Practica1.Models;
using System.Text.Json;

namespace Practica1.Pages;

public class IndexModel : PageModel
{
    public List<Tarea> Tareas { get; set; } = new List<Tarea>();
    public int PaginaActual { get; set; } = 1;
    public int TamanoPagina { get; set; } = 5;
    public int TotalPaginas { get; set; } = 1;
    public int TotalTareas { get; set; } = 0;
    public string FiltroActual { get; set; } = "todos";

    public void OnGet(int pagina = 1, int tamanio = 5, string filtro = "todos")
    {
        if (pagina < 1) pagina = 1;
        if (tamanio < 1) tamanio = 5;

        PaginaActual = pagina;
        TamanoPagina = tamanio;
        FiltroActual = filtro;

        try
        {
            string jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "tareas.json");
            if (System.IO.File.Exists(jsonFilePath))
            {
                var jsonContent = System.IO.File.ReadAllText(jsonFilePath);
                var todasLasTareas = JsonSerializer.Deserialize<List<Tarea>>(jsonContent) ?? new List<Tarea>();

                List<Tarea> tareasActivas;

                switch (FiltroActual.ToLower())
                {
                    case "pendiente":
                        tareasActivas = todasLasTareas.Where(t => t.estado == "Pendiente").ToList();
                        break;
                    case "encurso":
                        tareasActivas = todasLasTareas.Where(t => t.estado == "En curso").ToList();
                        break;
                    default:
                        tareasActivas = todasLasTareas.Where(t => t.estado == "Pendiente" || t.estado == "En curso").ToList();
                        break;
                }

                TotalTareas = tareasActivas.Count;
                TotalPaginas = (int)Math.Ceiling(TotalTareas / (double)TamanoPagina);

                if (PaginaActual > TotalPaginas && TotalPaginas > 0)
                    PaginaActual = TotalPaginas;

                Tareas = tareasActivas
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
