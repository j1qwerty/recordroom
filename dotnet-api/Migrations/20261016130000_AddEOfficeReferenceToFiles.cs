using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecordRoom.Api.Infrastructure.Data;

#nullable disable

namespace RecordRoom.Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261016130000_AddEOfficeReferenceToFiles")]
public partial class AddEOfficeReferenceToFiles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "EOfficeReference",
            table: "Files",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "EOfficeReference", table: "Files");
    }
}
